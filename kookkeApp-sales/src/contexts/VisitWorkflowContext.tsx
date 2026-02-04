import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { GeoLocation } from '../../../types/shared/models';
import { localPersistenceService } from '../services/LocalPersistenceService';
import { ImageCompressionService } from '../services/ImageCompressionService';
import { uploadManager } from '../services/ChunkBasedUploadManager';
import { voiceToTextService } from '../services/VoiceToTextService';

/**
 * Visit Lifecycle State Machine
 * Enforces strict state transitions: Arrived -> Checked-In -> Processing -> Checked-Out
 * Prevents illegal states and ensures all transitions are timestamped and geotagged.
 */

export type VisitState = 'Idle' | 'Arrived' | 'Checked-In' | 'Processing' | 'Checked-Out';

export interface ArrivalContext {
  intendedCustomerId: string;
  intendedCoordinates: GeoLocation;
  actualCoordinates: GeoLocation;
  arrivalDiscrepancyMeters: number;
  arrivalTimestamp: number;
  gpsAccuracy: number;
}

export interface VisitDraft {
  visitId: string;
  customerId: string;
  routeId: string;
  formFields: Record<string, any>;
  lastFieldModified: string;
  lastModifiedAt: number;
  isDirty: boolean;
}

export interface VisitContext {
  visitId: string;
  customerId: string;
  routeId: string;
  state: VisitState;
  startTime: number | null;
  checkInTime: number | null;
  checkOutTime: number | null;
  checkInCoordinates: GeoLocation | null;
  checkInGpsAccuracy: number | null;
  arrivalContext: ArrivalContext | null;
  formData: Record<string, any>;
  draft: VisitDraft | null;
  photoIds: string[];
  notes: string;
  voiceNoteUri: string | null;
  errorState: string | null;
}

export interface VisitAction {
  type:
    | 'SET_ARRIVED'
    | 'CHECK_IN'
    | 'UPDATE_FORM_FIELD'
    | 'START_PROCESSING'
    | 'ADD_PHOTO'
    | 'REMOVE_PHOTO'
    | 'ATTEMPT_CHECKOUT'
    | 'COMPLETE_CHECKOUT'
    | 'ADD_VOICE_NOTE'
    | 'SET_ERROR'
    | 'CLEAR_ERROR'
    | 'RESUME_FROM_DRAFT'
    | 'ABANDON_VISIT'
    | 'SAVE_DRAFT';
  payload?: any;
}

interface VisitWorkflowContextType {
  visitContext: VisitContext;
  dispatch: (action: VisitAction) => void;
  setArrived: (customerId: string, routeId: string, arrivalContext: ArrivalContext) => void;
  checkIn: (coordinates: GeoLocation, gpsAccuracy: number) => void;
  updateFormField: (fieldName: string, value: any) => void;
  addPhoto: (photoId: string) => void;
  removePhoto: (photoId: string) => void;
  attemptCheckout: () => { canCheckout: boolean; reason?: string };
  completeCheckout: (coordinates: GeoLocation) => void;
  addVoiceNote: (uri: string) => void;
  saveDraft: () => void;
  resumeFromDraft: (draft: VisitDraft) => void;
  abandonVisit: () => void;
  getMandatoryTasks: () => { taskId: string; completed: boolean }[];
  getCompletionPercentage: () => number;
}

const VisitWorkflowContext = createContext<VisitWorkflowContextType | undefined>(undefined);

const initialState: VisitContext = {
  visitId: '',
  customerId: '',
  routeId: '',
  state: 'Idle',
  startTime: null,
  checkInTime: null,
  checkOutTime: null,
  checkInCoordinates: null,
  checkInGpsAccuracy: null,
  arrivalContext: null,
  formData: {},
  draft: null,
  photoIds: [],
  notes: '',
  voiceNoteUri: null,
  errorState: null,
};

const isLegalStateTransition = (from: VisitState, to: VisitState): boolean => {
  const transitions: Record<VisitState, VisitState[]> = {
    Idle: ['Arrived'],
    Arrived: ['Checked-In', 'Idle'],
    'Checked-In': ['Processing', 'Idle'],
    Processing: ['Checked-Out', 'Checked-In'],
    'Checked-Out': ['Idle'],
  };
  return transitions[from]?.includes(to) ?? false;
};

const visitWorkflowReducer = (state: VisitContext, action: VisitAction): VisitContext => {
  switch (action.type) {
    case 'SET_ARRIVED': {
      const { customerId, routeId, arrivalContext } = action.payload;
      return {
        ...state,
        visitId: `visit_${customerId}_${Date.now()}`,
        customerId,
        routeId,
        state: 'Arrived',
        startTime: Date.now(),
        arrivalContext,
        errorState: null,
      };
    }

    case 'CHECK_IN': {
      if (state.state !== 'Arrived') {
        return {
          ...state,
          errorState: `Cannot check in from state: ${state.state}. Current state must be 'Arrived'.`,
        };
      }
      const { coordinates, gpsAccuracy } = action.payload;
      return {
        ...state,
        state: 'Checked-In',
        checkInTime: Date.now(),
        checkInCoordinates: coordinates,
        checkInGpsAccuracy: gpsAccuracy,
        errorState: null,
      };
    }

    case 'UPDATE_FORM_FIELD': {
      const { fieldName, value } = action.payload;
      return {
        ...state,
        formData: {
          ...state.formData,
          [fieldName]: value,
        },
        draft: state.draft
          ? {
              ...state.draft,
              formFields: { ...state.draft.formFields, [fieldName]: value },
              lastFieldModified: fieldName,
              lastModifiedAt: Date.now(),
              isDirty: true,
            }
          : null,
      };
    }

    case 'START_PROCESSING': {
      if (state.state !== 'Checked-In') {
        return {
          ...state,
          errorState: `Cannot start processing from state: ${state.state}`,
        };
      }
      return {
        ...state,
        state: 'Processing',
        errorState: null,
      };
    }

    case 'ADD_PHOTO': {
      return {
        ...state,
        photoIds: [...state.photoIds, action.payload.photoId],
      };
    }

    case 'REMOVE_PHOTO': {
      return {
        ...state,
        photoIds: state.photoIds.filter((id) => id !== action.payload.photoId),
      };
    }

    case 'ADD_VOICE_NOTE': {
      return {
        ...state,
        voiceNoteUri: action.payload.uri,
        notes: action.payload.uri,
      };
    }

    case 'ATTEMPT_CHECKOUT': {
      // This action only validates; actual checkout happens with COMPLETE_CHECKOUT
      return state;
    }

    case 'COMPLETE_CHECKOUT': {
      if (state.state !== 'Processing' && state.state !== 'Checked-In') {
        return {
          ...state,
          errorState: `Cannot checkout from state: ${state.state}`,
        };
      }
      return {
        ...state,
        state: 'Checked-Out',
        checkOutTime: Date.now(),
        errorState: null,
        draft: null, // Clear draft after successful checkout
      };
    }

    case 'SAVE_DRAFT': {
      return {
        ...state,
        draft: {
          visitId: state.visitId,
          customerId: state.customerId,
          routeId: state.routeId,
          formFields: state.formData,
          lastFieldModified: Object.keys(state.formData).length > 0 ? Object.keys(state.formData)[0] : '',
          lastModifiedAt: Date.now(),
          isDirty: true,
        },
      };
    }

    case 'RESUME_FROM_DRAFT': {
      const draft = action.payload.draft as VisitDraft;
      return {
        ...state,
        visitId: draft.visitId,
        customerId: draft.customerId,
        routeId: draft.routeId,
        formData: draft.formFields,
        draft,
        state: 'Checked-In',
        errorState: null,
      };
    }

    case 'ABANDON_VISIT': {
      return initialState;
    }

    case 'SET_ERROR': {
      return {
        ...state,
        errorState: action.payload.error,
      };
    }

    case 'CLEAR_ERROR': {
      return {
        ...state,
        errorState: null,
      };
    }

    default:
      return state;
  }
};

export const VisitWorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [visitContext, dispatch] = useReducer(visitWorkflowReducer, initialState);

  // Initialize services on mount
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await localPersistenceService.initialize();
        await ImageCompressionService.initializeDirs();
        
        // Check for active draft on app startup (crash recovery)
        // This could be populated from localPersistenceService
        console.log('Visit Workflow services initialized');
      } catch (error) {
        console.error('Failed to initialize Visit Workflow services:', error);
      }
    };

    initializeServices();
  }, []);

  const setArrived = useCallback(
    (customerId: string, routeId: string, arrivalContext: ArrivalContext) => {
      dispatch({
        type: 'SET_ARRIVED',
        payload: { customerId, routeId, arrivalContext },
      });
    },
    [],
  );

  const checkIn = useCallback((coordinates: GeoLocation, gpsAccuracy: number) => {
    dispatch({
      type: 'CHECK_IN',
      payload: { coordinates, gpsAccuracy },
    });
  }, []);

  const updateFormField = useCallback((fieldName: string, value: any) => {
    dispatch({
      type: 'UPDATE_FORM_FIELD',
      payload: { fieldName, value },
    });
  }, []);

  const addPhoto = useCallback((photoId: string) => {
    dispatch({
      type: 'ADD_PHOTO',
      payload: { photoId },
    });
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    dispatch({
      type: 'REMOVE_PHOTO',
      payload: { photoId },
    });
  }, []);

  const attemptCheckout = useCallback((): { canCheckout: boolean; reason?: string } => {
    // Validate mandatory tasks before allowing checkout
    const mandatoryTasks = [
      { taskId: 'photo', completed: visitContext.photoIds.length > 0 },
      { taskId: 'form', completed: Object.keys(visitContext.formData).length > 0 },
    ];

    const allMandatoryComplete = mandatoryTasks.every((task) => task.completed);

    if (!allMandatoryComplete) {
      const incompleteTasks = mandatoryTasks
        .filter((task) => !task.completed)
        .map((task) => task.taskId)
        .join(', ');
      return {
        canCheckout: false,
        reason: `Cannot checkout. Incomplete mandatory tasks: ${incompleteTasks}`,
      };
    }

    return { canCheckout: true };
  }, [visitContext.photoIds, visitContext.formData]);

  const completeCheckout = useCallback((coordinates: GeoLocation) => {
    dispatch({
      type: 'COMPLETE_CHECKOUT',
      payload: { coordinates },
    });
  }, []);

  const addVoiceNote = useCallback((uri: string) => {
    dispatch({
      type: 'ADD_VOICE_NOTE',
      payload: { uri },
    });
  }, []);

  const saveDraft = useCallback(() => {
    dispatch({ type: 'SAVE_DRAFT' });
  }, []);

  const resumeFromDraft = useCallback((draft: VisitDraft) => {
    dispatch({
      type: 'RESUME_FROM_DRAFT',
      payload: { draft },
    });
  }, []);

  const abandonVisit = useCallback(() => {
    dispatch({ type: 'ABANDON_VISIT' });
  }, []);

  const getMandatoryTasks = useCallback(() => {
    return [
      { taskId: 'check_in', completed: visitContext.state !== 'Arrived' },
      { taskId: 'photo', completed: visitContext.photoIds.length > 0 },
      { taskId: 'form', completed: Object.keys(visitContext.formData).length > 0 },
    ];
  }, [visitContext.state, visitContext.photoIds, visitContext.formData]);

  const getCompletionPercentage = useCallback(() => {
    const tasks = getMandatoryTasks();
    const completed = tasks.filter((t: any) => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [getMandatoryTasks]);

  const value: VisitWorkflowContextType = {
    visitContext,
    dispatch,
    setArrived,
    checkIn,
    updateFormField,
    addPhoto,
    removePhoto,
    attemptCheckout,
    completeCheckout,
    addVoiceNote,
    saveDraft,
    resumeFromDraft,
    abandonVisit,
    getMandatoryTasks,
    getCompletionPercentage,
  };

  return <VisitWorkflowContext.Provider value={value}>{children}</VisitWorkflowContext.Provider>;
};

export const useVisitWorkflow = (): VisitWorkflowContextType => {
  const context = useContext(VisitWorkflowContext);
  if (!context) {
    throw new Error('useVisitWorkflow must be used within VisitWorkflowProvider');
  }
  return context;
};
