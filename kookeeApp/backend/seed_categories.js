const db = require('./db');

const rawData = {
    "Top Class Oils": [
        "Olive oil 24pc x 200ml", "Coconut oil 24pc x 200ml", "Jojoba oil 24pc x 200ml",
        "Jamaican blacker caster  24pc x 150ml", "Jamaican coconut black custer  24pc x 150ml",
        "Jamaican hair grower 24pc x 150ml", "Anti itch 24pc x 230ml", "Avocado oil 24pc x 200ml", "Onion oil 24pc x 200ml"
    ],
    "Emborg": {
        "Non-Dairy": [
            "Cook & Whip 1x6pcs", "WhipTopping 1x6pcs", "Culinary Cooking 1x6pcs",
        ],
        "Dairy": [
            "Uht Cooking Cream 20% 1ltr(12)", "Uht Cooking Cream 20% 200ml(27)", "Uht Whipping Cream 35.1% 1ltr(12)",
            "Uht Whipping Cream 35.1% 200ml(27)", "Whipped CREAM 30% spray can 250ML (12)",
            "cook cream /Perfect pasta 200ml(20*200ml)", "cook cream/perfect pasta 1 ltr(10*1ltr)",
            "Uht Sour Cream 24% Fat (12x1kg)", "Uht Yoghurt Natural 3.5% Fat (12x1Ltr)",
            "PSD Cheese Cheddar / Sandwich Slices (24x200gm)", "PSD Cheese Swiss Emmentaler flavour(24x200gm)",
            "PSD Cheese slices Dutch Gouda flavour(24x200gm)", "PSD Cheese slices american Cheddar flavour(24x200gm)",
            "PSD Cheese slices Italian Mozrella flavour(24x200gm)", "Perfect slices 100g",
            "Perfect slices 200g", "perfect cheddar slices 200gms (24*200gms)", "perfect cheddar slice 100gms (24*100gms)",
            "Perfect burger slices (cheddar) 100GM (24 X 100GM)", "Perfect burger slices (cheddar) 200GM (24 X 200GM)",
            "Cheddar sliced (12x150gms)", "Emmentaler cheese sliced(11x150gm)", "Gouda Sliced(12x150gm)",
            "Edam sliced(12x150gm)", "CAMEMBERT white cheese Plastic cup(12x 125 gm)",
            "BRIE White mould cheese, plastic cups(12x125gm)", "Cheddar cheese colour portion(15x400gm)",
            "Cheddar cheese white portion(15x400gm)", "Mild Cheddar white portion(16x200gm)",
            "Mild Cheddar colour portion(16x200gm)", "Emmentaler portion(15x200gm)",
            "CREAM CHEESE (12x200gm)", "FETA CHEESE IN BRINE CUBES(12X200gm)", "FETA CHEESE TRADITIONAL(10x200gm)"
        ],
        "Emborg Frozen Fruit & Vegetables": [
            "Strawberries 24* 450gms", "Blueberries 20* 400gms", "Raspberries 20* 300gms",
            "Garden peas 24*450gms", "Garden peas 12*900gms", "Mixed vegetables 24*450gms",
            "Broccoli Florets 20* 450gms", "Edamame Whole Green SoyBeans 20* 400gms",
            "French fries Straight cut 10* 1kg", "French Fries Crinkle cut 10* 1kg",
            "Whole Leaf spinach Portion 24* 450gms"
        ],
        "Vegan, Gluten Free, Soy Free Cheese": [
            "emborg vegan Plant Based mozzarella 150g", "emborg vegan Plant Based cheddar 150g",
        ],
        "*Emborg Portion": [
            "Butter Unsalted 200gm(20)", "Butter Salted 200gm(20)", "Vintage Cheddar Portion 200gm(16)",
            "mozerella portion 200gms (36)", "Mature Cheddar Portion200gm(16)", "Cheese Bites Triangles 140gm",
            "Grana Padano(12x150gm)", "Gouda Sliced wedge(12x200gm)", "Danablu plastic Tray (10x100gm)",
        ],
        "*Emborg Products Cheese Block": [
            "Grana Padano 1KG(6)", "Danablu Blocks Cheese 3KG(3)", "Cheddar coloured 2.5KG(8)",
            "Cheddar white 2.5KG(8)", "Gouda 4.5KG(1)", "Emmentaler 2.8KG(4)", "Cream Cheese Block 1.5Kg",
            "Mozerella single loaf 2.38kg (4)", "Mascarpone 6* 500gms",
        ],
    },
    "Temmy's Products": [
        "Choco Flakes 250gms 1x12pcs", "Choco Pillow 375gms 1x12pcs", "Choco Pops 250gms 1x12pcs",
        "Choco Pops 375gms 1x12pcs", "Choco Pops 500gms 1x12pcs", "Choco Rice 250gms 1x12pcs",
        "Choco Scoops 250gms 1x12pcs", "Corn Flakes 1kg 1x6pcs", "Corn Flakes 250gms 1x12pcs",
        "Corn Flakes 500gms 1x12pcs", "Fruit Rings 250gms 1x12pcs", "Fruit Rings 375gms 1x12pcs",
        "Honey pops 250gms 1x12pcs", "Honey pops 375gms 1x12pcs", "Mixed Cereals 30gm (48)",
        "Rice Crispies 1x12pcs", "Sweet Flakes 250gms 1x12pcs", "Sweet Flakes 375gms 1x12pcs",
    ],
    "Spices": {
        "Nature's Own (250 & 500G)": [
            "Ginger Ground 24*250Gms", "Tea Masala 24*250Gms", "Turmeric Ground 24*250Gms", "Pilau Masala ground 24*250Gms",
            "Chicken Masala 24*250Gms", "Mixed Spice aGround 24*250Gms", "Garam MasalA 24*250Gms", "Ginger Ground 24*500Gms",
            "Tea Masala 24*500Gms", "Turmeric Ground 24*500Gms", "Pilau Masala ground 24*500Gms", "Chicken Masala 24*500Gms",
            "Mixed Spices Ground 24*500Gms", "Garam Masala 24*500Gms", "CITRIC ACID",
        ],
        "Nature's Own (50GMS)": [
            "Black Pepper(12*50gms)", "Cardamons(12*50gms)", "Cayenne(12*50gms)", "Chat Masala(12*50gms)",
            "Chicken Masala(12*50gms)", "Chilli(12*50gms)", "Cinnamon(12*50gms)", "Cloves(12*50gms)",
            "Coriander(12*50gms)", "Cumin(12*50gms)", "Curry Powder(12*50gms)", "Dhana Jeera(12*50gms)",
            "Fish Masala(12*50gms)", "Garam Masala(12*50gms)", "Garlic Powder(12*50gms)", "Ginger(12*50gms)",
            "Mixed Spices(12*50gms)", "Mustard(12*50gms)", "Nutmeg(12*50gms)", "Pilau Masala(12*50gms)",
            "Spanish Paprika(12*50gms)", "Tandoori(12*50gms)", "Tea Masala(12*50gms)", "Turmeric(12*50gms)",
            "White Pepper(12*50gms)", "Biryani Masala(12*50gms)", "Italian Seasoning(12*50gms)",
            "Mexican Seasoning(12*50gms)", "Lemon Garlic Seasoning(12*50gms)", "Peri Peri Seasoning(12*50gms)",
        ],
        "Nature's Own (100GMS)": [
            "Black Pepper(12*100gms)", "Cardamons(12*100gms)", "Cayenne(12*100gms)", "Chat Masala(12*100gms)",
            "Chicken Masala(12*100gms)", "Chilli(12*100gms)", "Cinnamon(12*100gms)", "Cloves(12*100gms)",
            "Coriander(12*100gms)", "Cumin(12*100gms)", "Curry Powder(12*100gms)", "Dhana Jeera(12*100gms)",
            "Fish Masala(12*100gms)", "Garam Masala(12*100gms)", "Garlic Powder(12*100gms)", "Ginger(12*100gms)",
            "Mixed Spices(12*100gms)", "Mustard(12*100gms)", "Nutmeg(12*100gms)", "Pilau Masala(12*100gms)",
            "Spanish Paprika(12*100gms)", "Tandoori(12*100gms)", "Tea Masala(12*100gms)", "Turmeric(12*100gms)",
            "White Pepper(12*100gms)", "Biryani Masala(12*100gms)", "Italian Seasoning(12*100gms)",
            "Mexican Seasoning(12*100gms)", "Lemon Garlic Seasoning(12*100gms)", "Peri Peri Seasoning(12*100gms)"
        ],
        "Nature's Own (20GMS)": [
            "Basil(20gms*12)", "Bay Leaves(20gms*12)", "Marjoram(20gms*12)", "Mint(20gms*12)", "Mixed Herbs(20gms*12)",
            "Oregano(20gms*12)", "Parsley(20gms*12)", "Rosemary(20gms*12)", "Sage(20gms*12)", "Thyme(20gms*12)"
        ],
    },
    "Pastas": {
        "Elmaleka pasta/spaghetti 400GMS": [
            "Penne(elmaleka 20*400gms)", "Elbow(elmaleka 20*400gms)", "Fusilli(elmaleka 20*400gms)",
            "Big Rings(elmaleka 20*400gms)", "Spaghetti 400gm(elmaleka 20*400gms)"
        ],
        "Italiano pasta/spaghetti 400GMS": [
            "Spaghetti(italiano 20*400gms)", "Fettucine(italiano 20*400gms)", "Vermicelli(italiano 20*400gms)",
            "Serpentini(italiano 20*400gms)", "Fusilli(italiano 20*400gms)", "Shells(italiano 20*400gms)",
            "Penne(italiano 20*400gms)", "Ziti(italiano 20*400gms)", "Lasagna(italiano 20*400gms)"
        ],
    },
    "Ice Cream": {
        "Assorted Packets": [
            "120 ML ASSORTED(72)", "220 ML ASSORTED(72)", "250 ML ASSORTED(48)", "500 ML ASSORTED(48)", "125 ML ASSORTED(48)"
        ],
        "Classic Premium(1ltr)": [
            "VANILLA(6*1ltr)", "STRAWBERRY(6*1ltr)", "CHOCOLATE(6*1ltr)", "CLASSIC MANGO(6*1ltr)", "LEMON(6*1ltr)",
            "PISTA(6*1ltr)", "VANILLA/CHOCOLATE(6*1ltr)", "VANILLA MANGO(6*1ltr)", "VANILLA/STRAWBERRY(6*1ltr)"
        ],
        "Infusion Premium(1ltr)": [
            "AMERICAN NUTS 6*12pcs", "AMERICAN CARNIVAL(6*1ltr)", "BELGIUM CHOCOLATE(6*1ltr)", "BONANZA(6*1ltr)",
            "BUTTER SCOTCH(6*1ltr)", "STRAWBERRY CHEESECAKE(6*1ltr)", "BLUEBERRY CHEESECAKE(6*1ltr)",
            "CHOCO/CHOCO/CHIPS(6*1ltr)", "COOKIES&CREAM(6*1ltr)", "FIG & CASHEWNUT(6*1ltr)", "GOLDEN PEARL(6*1ltr)",
            "SAFFRON PISTA(6*1ltr)", "KINGS CHOICE(6*1ltr)", "PINE CHIPS(6*1ltr)", "RAISIN & CASHEWNUT(6*1ltr)",
            "COFFEE DELIGHT(6*1ltr)", "SWISS CAKE(6*1ltr)", "TOFFEE CRUNCH(6*1ltr)", "TUTTY FRUITY(6*1ltr)",
            "VANILLA CHOCOCHIPS(6*1ltr)", "ROSE PETAL(6*1ltr)", "LONAVALI(6*1ltr)", "PAN MASALA(6*1ltr)",
            "CHIKU(6*1ltr)", "SALTED CARAMEL(6*1ltr)", "FRESH MANGO (WITH FRUIT)(6*1ltr)", "FRESH BANANA (WITH FRUIT)(6*1ltr)", "PINK GUAVA(6*1ltr)"
        ],
        "(2ltr)": [
            "VANILLA(4*2ltr)", "STRAWBERRY(4*2ltr)", "CHOCOLATE(4*2ltr)", "VANILLA/CHOCOLATE(4*2ltr)", "VANILLA/STRAWBERRY(4*2ltr)"
        ],
        "(4ltr)": [
            "CLASSIC MANGO(2*4ltr)", "LEMON(2*4ltr)", "PISTA(2*4ltr)"
        ],
        "(5ltr)": [
            "VANILLA(2*5ltr)", "STRAWBERRY(2*5ltr)", "CHOCOLATE(2*5ltr)", "VANILLA/CHOCOLATE(2*5ltr)",
            "VANILLA/STRAWBERRY(2*5ltr)", "MANGO(2*5ltr)", "BANANA(2*5ltr)", "AMERICAN NUTS(2*5ltr)"
        ],
        "Candybar": [
            "CHOCO BAR-PLAIN 22*75ML", "CHOCOLATE CHOCO BAR 22*75ML", "NUTTY CHOCO BAR 22*75ML",
            "MANGO DOLLY 22*75ML", "STRAWBERRY BAR 22*75ML", "RASPBERRY BAR 22*75ML", "PISTA BAR 22*75ML",
            "ORANGE BAR 22*75ML", "KESAR KULFI 22*50ML", "CASSATA SLICE 22*80gm"
        ],
        "Kooksy Yoghurt": [
            "yoghurt vanilla cup 500ml", "yoghurt straw. cup 500ml", "yoghurt plain cup 500ml", "yoghurt toffee cup 500ml"
        ],
        "Icecream Cone": [
            "BUTTERSCOTCH 6*140 ML", "CHOCOLATE 6*140ML", "MANGO 6*140ML", "STRAWBERRY 6*140ML", "VANILLA 6*140ML"
        ],
    },
};

async function seed() {
    console.log('--- SEEDING PRODUCT CATEGORIES & SUBCATEGORIES ---');
    let totalUpdated = 0;

    for (const catName in rawData) {
        const subOrItems = rawData[catName];

        if (Array.isArray(subOrItems)) {
            // No subcategory (Direct items)
            for (const itemName of subOrItems) {
                const res = await db.query(
                    "UPDATE products SET category = $1, subcategory = $2 WHERE name = $3",
                    [catName, 'General', itemName]
                );
                if (res.rowCount > 0) totalUpdated++;
            }
        } else {
            // Has subcategories
            for (const subName in subOrItems) {
                for (const itemName of subOrItems[subName]) {
                    const res = await db.query(
                        "UPDATE products SET category = $1, subcategory = $2 WHERE name = $3",
                        [catName, subName, itemName]
                    );
                    if (res.rowCount > 0) totalUpdated++;
                }
            }
        }
    }

    console.log(`✅ Seeded ${totalUpdated} products with category info.`);
    process.exit(0);
}

seed();
