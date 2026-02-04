import React from 'react';
import { useVisitWorkflow } from '../contexts/VisitWorkflowContext';

interface VisitProgressHeaderProps {
  onCheckOut?: () => void;
  isCheckOutDisabled?: boolean;
}

export const VisitProgressHeader: React.FC<VisitProgressHeaderProps> = ({ onCheckOut, isCheckOutDisabled = false }) => {
  const { visitContext, getMandatoryTasks, getCompletionPercentage, attemptCheckout } = useVisitWorkflow();

  const mandatoryTasks = getMandatoryTasks();
  const completionPercentage = getCompletionPercentage();

  const handleCheckOutClick = () => {
    const { canCheckout, reason } = attemptCheckout();

    if (!canCheckout) {
      alert(`Cannot checkout: ${reason}`);
      return;
    }

    onCheckOut?.();
  };

  const taskStatus = {
    check_in: mandatoryTasks.find((t) => t.taskId === 'check_in'),
    photo: mandatoryTasks.find((t) => t.taskId === 'photo'),
    form: mandatoryTasks.find((t) => t.taskId === 'form'),
  };

  return (
    <div className="visit-progress-header">
      <div className="header-top">
        <div className="visit-info">
          <h3 className="visit-title">Active Visit</h3>
          <p className="customer-name" title={visitContext.customerId}>{visitContext.customerId}</p>
        </div>
        <div className="state-badge">
          <span className={`state-indicator state-${visitContext.state.toLowerCase().replace('-', '_')}`}>
            {visitContext.state}
          </span>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-bar-container">
          <div className="progress-bar-label">
            <span>Progress</span>
            <span className="progress-percentage">{completionPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <div className="tasks-section">
        <div className="tasks-header">
          <h4>Mandatory Tasks</h4>
          <span className="tasks-count">
            {mandatoryTasks.filter((t) => t.completed).length}/{mandatoryTasks.length} completed
          </span>
        </div>

        <div className="tasks-list">
          <div className={`task-item ${taskStatus.check_in?.completed ? 'completed' : 'pending'}`}>
            <div className="task-indicator">
              {taskStatus.check_in?.completed ? (
                <span className="checkmark">✓</span>
              ) : (
                <span className="pending-dot">●</span>
              )}
            </div>
            <div className="task-label">
              <span className="task-name">Check-In</span>
              {!taskStatus.check_in?.completed && <span className="mandatory-badge">Required</span>}
            </div>
            <div className="task-status">
              {taskStatus.check_in?.completed && (
                <span className="check-in-time">
                  {visitContext.checkInTime ? new Date(visitContext.checkInTime).toLocaleTimeString() : 'N/A'}
                </span>
              )}
            </div>
          </div>

          <div className={`task-item ${taskStatus.photo?.completed ? 'completed' : 'pending'}`}>
            <div className="task-indicator">
              {taskStatus.photo?.completed ? (
                <span className="checkmark">✓</span>
              ) : (
                <span className="pending-dot">●</span>
              )}
            </div>
            <div className="task-label">
              <span className="task-name">Photo Capture</span>
              {!taskStatus.photo?.completed && <span className="mandatory-badge">Required</span>}
            </div>
            <div className="task-status">
              {taskStatus.photo?.completed && <span className="photo-count">{visitContext.photoIds.length} photo(s)</span>}
            </div>
          </div>

          <div className={`task-item ${taskStatus.form?.completed ? 'completed' : 'pending'}`}>
            <div className="task-indicator">
              {taskStatus.form?.completed ? (
                <span className="checkmark">✓</span>
              ) : (
                <span className="pending-dot">●</span>
              )}
            </div>
            <div className="task-label">
              <span className="task-name">Form Data</span>
              {!taskStatus.form?.completed && <span className="mandatory-badge">Required</span>}
            </div>
            <div className="task-status">
              {taskStatus.form?.completed && (
                <span className="form-count">{Object.keys(visitContext.formData).length} field(s)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="checkout-section">
        <button
          className={`checkout-button ${isCheckOutDisabled || completionPercentage < 100 ? 'disabled' : ''}`}
          onClick={handleCheckOutClick}
          disabled={isCheckOutDisabled || completionPercentage < 100}
          title={
            completionPercentage < 100
              ? 'Complete all mandatory tasks before checking out'
              : 'Check out of this visit'
          }
        >
          {completionPercentage < 100 ? '🔒 Complete Tasks to Checkout' : '✓ Check-Out'}
        </button>
        {visitContext.errorState && <div className="error-alert">{visitContext.errorState}</div>}
      </div>

      <style jsx>{`
        .visit-progress-header {
          background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
          border-bottom: 2px solid #e0e0e0;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .visit-info {
          flex: 1;
        }

        .visit-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #333;
        }

        .customer-name {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .state-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .state-indicator {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .state-idle {
          background-color: #e0e0e0;
          color: #666;
        }

        .state-arrived {
          background-color: #fff3cd;
          color: #856404;
        }

        .state-checked_in {
          background-color: #cfe2ff;
          color: #084298;
        }

        .state-processing {
          background-color: #cff4fc;
          color: #055160;
        }

        .state-checked_out {
          background-color: #d1e7dd;
          color: #0f5132;
        }

        .progress-section {
          margin-bottom: 16px;
        }

        .progress-bar-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-bar-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }

        .progress-percentage {
          background-color: #2196f3;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2196f3 0%, #1976d2 100%);
          transition: width 0.3s ease;
        }

        .tasks-section {
          margin-bottom: 16px;
        }

        .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e0e0e0;
        }

        .tasks-header h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: #333;
        }

        .tasks-count {
          font-size: 12px;
          color: #666;
          background-color: #f0f0f0;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background-color: white;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          transition: border-color 0.2s;
        }

        .task-item.completed {
          background-color: #f1f8e9;
          border-color: #c5e1a5;
        }

        .task-item.pending {
          background-color: #fff9c4;
          border-color: #fff59d;
        }

        .task-indicator {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .task-item.completed .task-indicator {
          background-color: #4caf50;
        }

        .task-item.pending .task-indicator {
          background-color: #ff9800;
        }

        .checkmark {
          color: white;
          font-size: 14px;
          font-weight: 700;
        }

        .pending-dot {
          color: white;
          font-size: 16px;
        }

        .task-label {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .task-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .mandatory-badge {
          font-size: 11px;
          font-weight: 600;
          color: #e74c3c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .task-status {
          flex-shrink: 0;
          text-align: right;
        }

        .check-in-time,
        .photo-count,
        .form-count {
          font-size: 12px;
          color: #666;
          background-color: #f5f5f5;
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }

        .checkout-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checkout-button {
          padding: 12px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }

        .checkout-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
        }

        .checkout-button.disabled,
        .checkout-button:disabled {
          background: linear-gradient(135deg, #ccc 0%, #999 100%);
          color: #666;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .error-alert {
          padding: 10px 12px;
          background-color: #ffebee;
          border: 1px solid #ef5350;
          border-radius: 4px;
          color: #c62828;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};
