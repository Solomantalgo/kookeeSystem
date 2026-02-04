import { useReducer, useCallback, useEffect } from 'react';
import { VisitState, VisitAction, VisitContextData, VisitData } from '../types/visitWorkflow';

// State Machine for Visit Lifecycle: Arrived -> Checked-In -> Processing -> Checked-Out
export const visitStateReducer = (state: VisitState, action: VisitAction): VisitState => {
  switch (action.type) {
    case 'ARRIVAL_DETECTED': {
      if (state.currentVisit && state.currentVisit.status !== 'checked-out') {
        console.warn('Cannot arrive at new customer while checked-in to another');
        return state;
      }
      return {
        ...state,
        currentVisit: {
          customerId: action.payload.customerId,
          routeId: action.payload.routeId,
          status: 'arrived',
          arrivedAt: new Date(),
          checkInLocation: action.payload.location,
          arrivalGPSAccuracy: action.payload.accuracy,
          arrivalDiscrepancy: action.payload.discrepancy || 0,
          completedTasks: [],
          formData: {},
          draftData: {},
          photoIds: [],
        },
        history: [
          ...state.history,
          {
            customerId: action.payload.customerId,
            status: 'arrived',
            timestamp: new Date(),
            location: action.payload.location,
          },
        ],
      };
    }

    case 'CHECK_IN': {
      if (!state.currentVisit || state.currentVisit.status !== 'arrived') {
        console.warn('Cannot check in - visit not in arrived state');
        return state;
      }
      return {
        ...state,
        currentVisit: {
          ...state.currentVisit,
          status: 'checked-in',
          checkedInAt: new Date(),
          checkInLocation: action.payload.location,
        },
        history: [
          ...state.history,
          {
            customerId: state.currentVisit.customerId,
            status: 'checked-in',
            timestamp: new Date(),
            location: action.payload.location,
          },
        ],
      };
    }

    case 'START_PROCESSING': {
      if (!state.currentVisit || state.currentVisit.status !== 'checked-in') {
        console.warn('Cannot start processing - visit not checked in');
        return state;
      }
      return {
        ...state,
        currentVisit: {
          ...state.currentVisit,
          status: 'processing',
          processingStartedAt: new Date(),
        },
        history: [
          ...state.history,
          {
            customerId: state.currentVisit.customerId,
            status: 'processing',
            timestamp: new Date(),
            location: action.payload?.location,
          },
        ],
      };
    }

    case 'UPDATE_FORM_DATA': {
      if (!state.currentVisit) {
        console.warn('No active visit to update form data');
        return state;
      }
      return {
        ...state,
        currentVisit: {
          ...state.currentVisit,
          formData: {
            ...state.currentVisit.formData,
            ...action.payload.data,
          },
          draftData: {
            ...state.currentVisit.draftData,
            ...action.payload.data,
          },
        },
      };
    }

    case 'MARK_TASK_COMPLETE': {
      if (!state.currentVisit) {
        console.warn('No active visit to mark task');
        return state;
      }
      const taskId = action.payload.taskId;
      if (!state.currentVisit.completedTasks.includes(taskId)) {
        return {
          ...state,
          currentVisit: {
            ...state.currentVisit,
            completedTasks: [...state.currentVisit.completedTasks, taskId],
          },
        };
      }
      return state;
    }

    case 'ADD_PHOTO': {
      if (!state.currentVisit) {
        console.warn('No active visit to add photo');
        return state;
      }
      return {
        ...state,
        currentVisit: {
          ...state.currentVisit,
          photoIds: [...state.currentVisit.photoIds, action.payload.photoId],
        },
      };
    }

    case 'CHECK_OUT': {
      if (!state.currentVisit || state.currentVisit.status !== 'processing') {
        console.warn('Cannot check out - visit not in processing state');
        return state;
      }

      // Validate mandatory tasks are completed
      const mandatoryTasksComplete = checkMandatoryTasksComplete(
        state.currentVisit.completedTasks,
        action.payload.customerType
      );

      if (!mandatoryTasksComplete && !action.payload.overrideReason) {
        console.warn('Cannot check out - mandatory tasks incomplete and no override reason');
        return state;
      }

      const completedVisit: VisitData = {
        ...state.currentVisit,
        status: 'checked-out',
        checkedOutAt: new Date(),
        totalDuration:
          state.currentVisit.checkInLocation && new Date().getTime() - state.currentVisit.checkedInAt!.getTime(),
        overrideReason: action.payload.overrideReason,
      };

      return {
        ...state,
        currentVisit: undefined,
        completedVisits: [...state.completedVisits, completedVisit],
        history: [
          ...state.history,
          {
            customerId: completedVisit.customerId,
            status: 'checked-out',
            timestamp: new Date(),
            location: action.payload.checkoutLocation,
          },
        ],
      };
    }

    case 'RESTORE_FROM_DRAFT': {
      return {
        ...state,
        currentVisit: action.payload.draftVisit,
      };
    }

    case 'CANCEL_VISIT': {
      return {
        ...state,
        currentVisit: undefined,
        draftVisits: [...state.draftVisits, state.currentVisit!],
      };
    }

    default:
      return state;
  }
};

// Helper function to check if mandatory tasks are complete
const checkMandatoryTasksComplete = (completedTasks: string[], customerType: string): boolean => {
  const mandatoryTasks: Record<string, string[]> = {
    retail: ['check-in', 'stock-audit', 'photo-capture'],
    wholesale: ['check-in', 'brand-presence', 'photo-capture'],
    distributor: ['check-in', 'stock-audit', 'delivery-note'],
    default: ['check-in', 'photo-capture'],
  };

  const required = mandatoryTasks[customerType] || mandatoryTasks.default;
  return required.every((task) => completedTasks.includes(task));
};

// Hook to manage visit lifecycle
export const useVisitLifecycle = (initialState: VisitState) => {
  const [state, dispatch] = useReducer(visitStateReducer, initialState);

  // Check for active visit on mount (crash recovery)
  useEffect(() => {
    const checkForActiveVisit = async () => {
      // This would load from SQLite drafts table
      // For now, placeholder for crash recovery logic
    };
    checkForActiveVisit();
  }, []);

  const handleArrival = useCallback(
    (customerId: string, routeId: string, location: any, accuracy: number, discrepancy?: number) => {
      dispatch({
        type: 'ARRIVAL_DETECTED',
        payload: { customerId, routeId, location, accuracy, discrepancy },
      });
    },
    []
  );

  const handleCheckIn = useCallback((location: any) => {
    dispatch({
      type: 'CHECK_IN',
      payload: { location },
    });
  }, []);

  const handleStartProcessing = useCallback((location?: any) => {
    dispatch({
      type: 'START_PROCESSING',
      payload: { location },
    });
  }, []);

  const updateFormData = useCallback((data: Record<string, any>) => {
    dispatch({
      type: 'UPDATE_FORM_DATA',
      payload: { data },
    });
  }, []);

  const markTaskComplete = useCallback((taskId: string) => {
    dispatch({
      type: 'MARK_TASK_COMPLETE',
      payload: { taskId },
    });
  }, []);

  const addPhoto = useCallback((photoId: string) => {
    dispatch({
      type: 'ADD_PHOTO',
      payload: { photoId },
    });
  }, []);

  const handleCheckOut = useCallback(
    (customerType: string, checkoutLocation?: any, overrideReason?: string) => {
      dispatch({
        type: 'CHECK_OUT',
        payload: { customerType, checkoutLocation, overrideReason },
      });
    },
    []
  );

  const restoreFromDraft = useCallback((draftVisit: VisitData) => {
    dispatch({
      type: 'RESTORE_FROM_DRAFT',
      payload: { draftVisit },
    });
  }, []);

  const cancelVisit = useCallback(() => {
    dispatch({ type: 'CANCEL_VISIT' });
  }, []);

  return {
    state,
    handleArrival,
    handleCheckIn,
    handleStartProcessing,
    updateFormData,
    markTaskComplete,
    addPhoto,
    handleCheckOut,
    restoreFromDraft,
    cancelVisit,
  };
};
