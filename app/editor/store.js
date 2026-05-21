import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

const useStore = create(
  persist(
    (set, get) => ({
      journals: [],
      activeJournalId: null,
      simConfig: null,
      simType: null,
      violationState: "OPTIMAL",
      violations: [],
      isGenerating: false,
      agentStatus: "idle",
      qualityMode: "fast",

      createJournal: (topic) => {
        const newJournal = {
          id: uuidv4(),
          title: topic || "Untitled Journal",
          notes: "",
          simConfig: null,
          simType: null,
          topic: topic,
          qualityMode: get().qualityMode,
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          journals: [...state.journals, newJournal],
          activeJournalId: newJournal.id
        }));
        return newJournal.id;
      },

      switchJournal: (journalId) => {
        const journal = get().journals.find(j => j.id === journalId);
        if (journal) {
          set({
            activeJournalId: journalId,
            simConfig: journal.simConfig,
            simType: journal.simType,
            violationState: "OPTIMAL",
            violations: []
          });
          // Recheck violations for the loaded config
          if (journal.simConfig) {
            get().checkViolations(journal.simConfig);
          }
        }
      },

      updateNotes: (notes) => {
        const { activeJournalId, journals } = get();
        if (!activeJournalId) return;
        
        set({
          journals: journals.map(j =>
            j.id === activeJournalId ? { ...j, notes } : j
          )
        });
      },

      setSimConfig: (config) => {
        const { activeJournalId, journals } = get();
        set({ simConfig: config });
        
        if (activeJournalId) {
          set({
            journals: journals.map(j =>
              j.id === activeJournalId
                ? { ...j, simConfig: config, simType: config.simType }
                : j
            )
          });
        }
        
        get().checkViolations(config);
      },

      updateParam: (paramName, value) => {
        const { simConfig } = get();
        if (!simConfig) return;
        
        const newConfig = {
          ...simConfig,
          parameters: {
            ...simConfig.parameters,
            [paramName]: value
          }
        };
        
        get().setSimConfig(newConfig);
      },

      checkViolations: (config) => {
        if (!config || !config.parameters || !config.thresholds) {
          set({ violations: [], violationState: "OPTIMAL" });
          return;
        }

        const violations = [];
        
        for (const [param, value] of Object.entries(config.parameters)) {
          const threshold = config.thresholds[param];
          if (!threshold) continue;
          
          if (value >= threshold.critical) {
            violations.push({
              param,
              value,
              threshold: threshold.critical,
              level: "CRITICAL_FAILURE",
              message: config.failureExplanation || `${param} exceeded critical limit`
            });
          } else if (value >= threshold.warning) {
            violations.push({
              param,
              value,
              threshold: threshold.warning,
              level: "WARNING",
              message: `${param} approaching critical limit`
            });
          }
        }
        
        // Determine overall state
        let overallState = "OPTIMAL";
        if (violations.some(v => v.level === "CRITICAL_FAILURE")) {
          overallState = "CRITICAL_FAILURE";
        } else if (violations.some(v => v.level === "WARNING")) {
          overallState = "WARNING";
        }
        
        set({ violations, violationState: overallState });
      },

      autoFix: (physicsKB) => {
        const { simConfig, simType, violations } = get();
        if (!simConfig || !simType || violations.length === 0) return;
        
        const kbEntry = physicsKB[simType];
        if (!kbEntry) return;
        
        const fixedParams = { ...simConfig.parameters };
        const changedParams = [];
        
        for (const violation of violations) {
          if (violation.level === "WARNING" || violation.level === "CRITICAL_FAILURE") {
            const defaultValue = kbEntry.defaults[violation.param];
            if (defaultValue !== undefined) {
              fixedParams[violation.param] = defaultValue;
              changedParams.push({ param: violation.param, value: defaultValue });
            }
          }
        }
        
        const newConfig = {
          ...simConfig,
          parameters: fixedParams
        };
        
        get().setSimConfig(newConfig);
        
        return changedParams;
      },

      setViolationState: (state) => set({ violationState: state }),
      
      setAgentStatus: (status) => set({ agentStatus: status }),
      
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      
      setQualityMode: (mode) => set({ qualityMode: mode }),
      
      setSimType: (simType) => {
        const { activeJournalId, journals } = get();
        set({ simType });
        
        if (activeJournalId) {
          set({
            journals: journals.map(j =>
              j.id === activeJournalId ? { ...j, simType } : j
            )
          });
        }
      },

      deleteJournal: (journalId) => {
        const { journals, activeJournalId } = get();
        const newJournals = journals.filter(j => j.id !== journalId);
        
        let newActiveId = activeJournalId;
        if (activeJournalId === journalId) {
          newActiveId = newJournals.length > 0 ? newJournals[0].id : null;
        }
        
        set({ journals: newJournals, activeJournalId: newActiveId });
        
        if (newActiveId) {
          get().switchJournal(newActiveId);
        } else {
          set({ simConfig: null, simType: null, violationState: "OPTIMAL", violations: [] });
        }
      },

      renameJournal: (journalId, newTitle) => {
        const { journals } = get();
        set({
          journals: journals.map(j =>
            j.id === journalId ? { ...j, title: newTitle } : j
          )
        });
      }
    }),
    {
      name: 'fulcrum-storage',
      partialize: (state) => ({
        journals: state.journals,
        activeJournalId: state.activeJournalId,
        qualityMode: state.qualityMode
      })
    }
  )
);

export default useStore;
