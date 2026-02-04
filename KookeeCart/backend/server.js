
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import pkg from 'whatsapp-web.js';
const { Client, RemoteAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import QRCode from 'qrcode';
import mongoose from 'mongoose';
import { MongoStore } from 'wwebjs-mongo';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import os from 'os';
import crypto from 'crypto';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const MONGODB_URI = process.env.MONGODB_URI;
let client = null;
let latestQR = null;
let isInitializing = false;
let isReady = false;

// --- ENHANCED CRASH GUARD RAIL ---
process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.message) {
        // Suppress common Puppeteer/WhatsApp errors that don't affect functionality
        if (reason.message.includes('Execution context was destroyed') ||
            reason.message.includes('Target closed') ||
            reason.message.includes('Session closed') ||
            reason.message.includes('Protocol error') ||
            reason.message.includes('File not found for id') ||
            reason.message.includes('RemoteAuth-') ||
            (reason.message.includes('ENOENT') && (reason.message.includes('.wwebjs_auth') || reason.message.includes('.zip')))) {
            console.warn('⚠️ SUPPRESSED:', reason.message.split('\n')[0]);
            return;
        }
    }
    console.error('❌ UNHANDLED REJECTION:', reason.message || reason);
});

process.on('uncaughtException', (error) => {
    if (error.message && (
        (error.message.includes('ENOENT') && (error.message.includes('.wwebjs_auth') || error.message.includes('RemoteAuth-'))) ||
        error.message.includes('Target closed') ||
        error.message.includes('Protocol error')
    )) {
        console.warn('⚠️ SUPPRESSED EXCEPTION:', error.message.split('\n')[0]);
        return;
    }
    console.error('❌ UNCAUGHT EXCEPTION:', error);
});

// --- UTILITY: SAFE DIRECTORY CLEANUP ---
function safeCleanupSessionDir() {
    const sessionPath = './.wwebjs_auth';
    try {
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('🧹 Cleaned up local session directory');
        }
    } catch (err) {
        console.warn('⚠️ Could not clean session dir (ignored):', err.message);
    }
}

// --- UTILITY: CLEAN UP CORRUPTED MONGODB SESSION ---
async function cleanupMongoSession() {
    try {
        if (mongoose.connection.readyState === 1) {
            // Clear all RemoteAuth sessions from MongoDB
            const collections = await mongoose.connection.db.listCollections().toArray();
            const authCollectionExists = collections.some(col => col.name === 'auth');

            if (authCollectionExists) {
                const result = await mongoose.connection.db.collection('auth').deleteMany({});
                console.log(`🗑️  Cleared ${result.deletedCount} corrupted session(s) from MongoDB`);
            }
        }
    } catch (err) {
        console.warn('⚠️ Could not clean MongoDB session (ignored):', err.message);
    }
}

// --- MAIN INITIALIZATION FUNCTION ---
async function initializeClient() {
    if (isInitializing) {
        console.log('⏳ Initialization already in progress, skipping...');
        return;
    }

    if (!MONGODB_URI || MONGODB_URI.includes('your_mongodb_connection_string_here')) {
        console.warn("⚠️  MONGODB_URI is missing or placeholder. WhatsApp features are DISABLED.");
        console.warn("👉 Set MONGODB_URI in your .env file to enable WhatsApp.");
        isInitializing = false;
        return;
    }

    isInitializing = true;

    try {
        // Clean up old client instance
        if (client) {
            console.log('🔄 Cleaning up old client instance...');
            try {
                // Don't await - just fire and forget to avoid hanging
                client.destroy().catch(e => console.warn('Destroy warning (ignored):', e.message));
                // Give it a moment to clean up
                await sleep(1000);
            } catch (e) {
                console.warn('Old client cleanup warning (ignored):', e.message);
            }
            client = null;
        }

        // Clean up local session files
        safeCleanupSessionDir();

        console.log('🔗 Connecting to MongoDB...');

        // Only connect if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        }
        console.log('✅ Connected to MongoDB!');

        const store = new MongoStore({ mongoose: mongoose });

        console.log('🔍 Checking for existing session in MongoDB...');

        // ✅ Initialize WhatsApp client with proper RemoteAuth
        client = new Client({
            authStrategy: new RemoteAuth({
                store: store,
                clientId: 'kookee-whatsapp-bot', // This MUST stay consistent
                backupSyncIntervalMs: 60000, // Sync every minute (reduced from 5 min)
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-extensions',
                ],
                executablePath: process.env.CHROME_BIN || (os.platform() === 'win32' ? undefined : '/usr/bin/chromium'),
            },
        });

        // --- Event Listeners ---
        client.on('qr', qr => {
            latestQR = qr;
            isReady = false;
            console.log('📱 QR RECEIVED. Scan this with WhatsApp:');
            qrcode.generate(qr, { small: true });
            console.log(`\n🌐 Or visit: ${process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT}/qr\n`);
        });

        client.on('authenticated', () => {
            console.log('✅ AUTHENTICATED - Session will be saved to MongoDB');
        });

        client.on('ready', () => {
            console.log('✅ WhatsApp client is READY!');
            console.log('📱 Connected as:', client.info.pushname);
            latestQR = null;
            isReady = true;
            isInitializing = false;
        });

        client.on('auth_failure', async msg => {
            console.error('❌ Authentication failed:', msg);
            isInitializing = false;
            isReady = false;

            // Session is corrupted - clean everything and start fresh
            console.log('🗑️  Cleaning up corrupted session data...');
            safeCleanupSessionDir();
            await cleanupMongoSession();

            setTimeout(() => {
                console.log('🔄 Retrying initialization after auth failure...');
                initializeClient();
            }, 5000);
        });

        client.on('disconnected', async reason => {
            console.log('⚠️ Client disconnected:', reason);
            isInitializing = false;
            isReady = false;

            // CRITICAL: Don't reconnect on LOGOUT - this is likely Render restarting
            // The session is still in MongoDB, next startup will restore it
            if (reason === 'LOGOUT') {
                console.log('🛑 LOGOUT detected - This is likely a Render restart.');
                console.log('💾 Session is saved in MongoDB and will restore on next startup.');
                console.log('⏸️  Not attempting reconnection to avoid duplicate sessions.');
                safeCleanupSessionDir();
                return; // DON'T reconnect - let Render handle the restart
            }

            // For other disconnections (NAVIGATION, CONNECTION_LOST, etc.)
            if (reason === 'NAVIGATION') {
                console.log('🔄 Navigation detected. Scheduling reconnection...');
                safeCleanupSessionDir();
                setTimeout(() => {
                    console.log('🔄 Attempting reconnection...');
                    initializeClient();
                }, 3000);
            } else {
                // For unexpected disconnections, try immediate reconnect
                console.log('🔄 Unexpected disconnection. Attempting immediate reconnection...');
                setTimeout(() => initializeClient(), 1000);
            }
        });

        client.on('remote_session_saved', () => {
            console.log('💾 Session saved to MongoDB successfully');
        });

        client.on('loading_screen', (percent, message) => {
            console.log('⏳ Loading...', percent + '%', message);
        });

        // --- Start the client ---
        console.log('🚀 Starting WhatsApp client initialization...');
        await client.initialize();

    } catch (error) {
        console.error('❌ Error during client initialization:', error.message);
        isInitializing = false;
        safeCleanupSessionDir();

        if (error.message.includes('Invalid scheme') || error.message.includes('connection string')) {
            console.error('❌ Invalid MongoDB URI. Initialization aborted to prevent retry loop.');
            return;
        }

        console.log(`⏰ Retrying client initialization (Reason: ${error.message}) in 10 seconds...`);
        await sleep(10000);
        await initializeClient();
    }
}

// --- API ENDPOINTS ---

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>Kookee WhatsApp Bot</title></head>
            <body style="font-family: Arial; padding: 40px; background: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #25D366;">🍪 Kookee WhatsApp Bot</h1>
                    <p><strong>Status:</strong> ${isReady ? '✅ Connected' : '⏳ Initializing...'}</p>
                    <hr>
                    <h3>Available Endpoints:</h3>
                    <ul>
                        <li><a href="/qr">📱 QR Code (Scan to Connect)</a></li>
                        <li><a href="/health">💚 Health Check</a></li>
                        <li>POST /send-order (Send WhatsApp Messages)</li>
                    </ul>
                </div>
            </body>
        </html>
    `);
});

app.get('/qr', async (req, res) => {
    try {
        if (isReady && !latestQR) {
            return res.status(200).send(`
                <html>
                    <head>
                        <title>WhatsApp Status</title>
                        <meta http-equiv="refresh" content="10">
                    </head>
                    <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#e9ffed;">
                        <div style="text-align:center;padding:40px;border:2px solid #25D366;border-radius:12px;background:#d4edda;color:#155724;">
                            <h1>✅ WhatsApp Connected!</h1>
                            <p style="font-size:18px;">Bot is ready to send messages</p>
                            <p style="color:#666;">Connected as: <strong>${client?.info?.pushname || 'Unknown'}</strong></p>
                            <hr>
                            <p><small>This page refreshes every 10 seconds</small></p>
                        </div>
                    </body>
                </html>
            `);
        }

        if (!latestQR) {
            return res.status(404).send(`
                <html>
                    <head>
                        <title>WhatsApp Status</title>
                        <meta http-equiv="refresh" content="5">
                    </head>
                    <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#fff3cd;">
                        <div style="text-align:center;padding:40px;border:2px solid #ffc107;border-radius:12px;background:#fff3cd;color:#856404;">
                            <h2>⏳ Checking for existing session...</h2>
                            <p>Please wait while we restore your connection.</p>
                            <p><small>This page auto-refreshes every 5 seconds</small></p>
                        </div>
                    </body>
                </html>
            `);
        }

        const qrDataURL = await QRCode.toDataURL(latestQR);
        res.send(`
            <html>
                <head>
                    <title>Scan WhatsApp QR</title>
                    <meta http-equiv="refresh" content="30">
                </head>
                <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f8f9fa;padding:20px;">
                    <div style="text-align:center;background:white;padding:40px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
                        <h1 style="color:#25D366;">📱 Scan WhatsApp QR Code</h1>
                        <div style="margin:30px 0;">
                            <img src="${qrDataURL}" alt="WhatsApp QR Code" style="max-width:400px;border:2px solid #ddd;border-radius:8px;" />
                        </div>
                        <ol style="text-align:left;max-width:400px;margin:20px auto;">
                            <li>Open WhatsApp on your phone</li>
                            <li>Tap Menu or Settings</li>
                            <li>Tap Linked Devices</li>
                            <li>Tap Link a Device</li>
                            <li>Scan this QR code</li>
                        </ol>
                        <p style="color:#666;"><small>⏱ Auto-refreshes every 30 seconds</small></p>
                    </div>
                </body>
            </html>
        `);
    } catch (err) {
        console.error('❌ Error generating QR code:', err);
        res.status(500).send('Error generating QR code.');
    }
});

app.get('/health', (req, res) => {
    const status = {
        server: 'running',
        whatsapp: isReady ? 'connected' : 'disconnected',
        qr_available: !!latestQR,
        initializing: isInitializing,
        phone_number: client?.info?.wid?._serialized || null,
        push_name: client?.info?.pushname || null,
    };
    res.json(status);
});

// Manual session reset endpoint (for debugging)
app.post('/reset-session', async (req, res) => {
    try {
        console.log('🔄 Manual session reset requested...');

        // Destroy current client
        if (client) {
            try {
                await client.destroy();
            } catch (e) {
                console.warn('Client destroy error (ignored):', e.message);
            }
            client = null;
        }

        // Clean up everything
        safeCleanupSessionDir();
        await cleanupMongoSession();

        // Reinitialize
        isReady = false;
        isInitializing = false;
        latestQR = null;

        setTimeout(() => initializeClient(), 2000);

        res.json({
            success: true,
            message: 'Session reset initiated. Visit /qr to scan new QR code in a few seconds.'
        });
    } catch (error) {
        console.error('❌ Error resetting session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Utility functions
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function formatPhoneNumber(number) {
    if (!number) return null;
    number = number.replace(/\D/g, '');
    if (number.startsWith('0')) number = '256' + number.slice(1);
    return number + '@c.us';
}

async function safeSendMessage(client, recipient, content) {
    try {
        await client.sendMessage(recipient, content);
        console.log(`✅ Message sent to: ${recipient}`);
        await sleep(800);
    } catch (err) {
        console.error(`❌ Failed to send message to ${recipient}:`, err.message);
        throw err;
    }
}

// Main order route
app.post('/send-order', async (req, res) => {
    try {
        if (!isReady || !client?.info?.wid) {
            return res.status(503).json({
                success: false,
                error: "WhatsApp client not ready. Visit /qr to scan QR code."
            });
        }

        const { customerPhone, orderDetails } = req.body;

        if (!customerPhone) {
            return res.status(400).json({
                success: false,
                error: "customerPhone is required"
            });
        }

        const recipient = formatPhoneNumber(customerPhone);
        const message = `🍪 *New Order from Kookee*\n\n${JSON.stringify(orderDetails, null, 2)}`;

        await safeSendMessage(client, recipient, message);

        res.json({
            success: true,
            message: "Order sent successfully",
            recipient: customerPhone
        });
    } catch (error) {
        console.error('❌ Error sending order:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// --- STATIC IMAGE SERVING WITH CACHE HEADERS & ETAG ---
app.use('/images', (req, res, next) => {
    const filePath = path.join(__dirname, '../product-catalog/public/images', req.path);

    // Check if file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const stats = fs.statSync(filePath);
        // Generate ETag based on file size and modification time
        const etag = crypto
            .createHash('md5')
            .update(`${stats.size}-${stats.mtime.getTime()}`)
            .digest('hex');

        res.setHeader('ETag', `"${etag}"`);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
        res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());

        // Handle conditional requests
        if (req.headers['if-none-match'] === `"${etag}"`) {
            return res.status(304).end(); // Not Modified
        }
    }

    next();
}, express.static(path.join(__dirname, '../product-catalog/public/images')));

// --- IMAGE SYNC ENDPOINT ---
app.post('/sync-images', async (req, res) => {
    try {
        const { products } = req.body;
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ success: false, error: 'Invalid products array' });
        }

        const imagesDir = path.join(__dirname, '../product-catalog/public/images');

        // Ensure directory exists
        if (!fs.existsSync(imagesDir)) {
            console.log(`📂 Creating directory: ${imagesDir}`);
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        let syncedCount = 0;
        let errors = [];

        console.log(`🔄 Starting sync for ${products.length} products...`);

        // Process sequentially to avoid overwhelming network/fs
        for (const product of products) {
            try {
                if (!product.image || !product.name) continue;

                // Create clean filename: lowercase, spaces to dashes, remove special chars
                const cleanName = product.name
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and dashes
                    .replace(/\s+/g, '-')          // Replace spaces with dashes
                    .replace(/-+/g, '-');          // Replace multiple dashes with single dash
                const filename = `${cleanName}.webp`;
                const filePath = path.join(imagesDir, filename);

                if (fs.existsSync(filePath)) {
                    // console.log(`⏭️  Skipping existing: ${filename}`);
                    continue;
                }

                console.log(`⬇️  Downloading [${product.name}]...`);

                // Download image
                const response = await axios({
                    url: product.image,
                    method: 'GET',
                    responseType: 'arrayBuffer',
                    timeout: 30000
                });

                // Compress and convert to WebP using Sharp
                const compressedBuffer = await sharp(response.data)
                    .resize(600, 600, { 
                        fit: 'inside',
                        withoutEnlargement: true 
                    })
                    .webp({ 
                        quality: 75,
                        effort: 4 
                    })
                    .toBuffer();

                // Save compressed image
                fs.writeFileSync(filePath, compressedBuffer);

                syncedCount++;
                console.log(`✅ Compressed [${product.name}]: ${compressedBuffer.length} bytes`);
                
                // Small delay to be nice
                await sleep(100);

            } catch (err) {
                console.error(`❌ Failed to download image for ${product.name}:`, err.message);
                errors.push({ name: product.name, error: err.message });
            }
        }

        console.log(`✅ Sync complete. Downloaded ${syncedCount} new images.`);
        res.json({ success: true, syncedCount, errors });

    } catch (error) {
        console.error('❌ Error in /sync-images:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📴 SIGTERM received, shutting down gracefully...');
    if (client) {
        await client.destroy();
    }
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
    }
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📱 QR Code at: ${process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT}/qr`);
    console.log(`💚 Health check at: /health`);
});

// Initialize WhatsApp client
initializeClient();