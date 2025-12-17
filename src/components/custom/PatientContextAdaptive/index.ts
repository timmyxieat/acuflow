// PatientContextAdaptive - Adaptive Patient Context Panel
// Shows different content based on which SOAP section is focused

export { PatientContextAdaptive } from './PatientContextAdaptive'
export { DefaultContextView } from './DefaultContextView'
export { SubjectiveContextView } from './SubjectiveContextView'
export { ObjectiveContextView } from './ObjectiveContextView'
export { AssessmentContextView } from './AssessmentContextView'
export { PlanContextView } from './PlanContextView'

export type {
  PatientContextAdaptiveProps,
  ContextViewProps,
  FocusedSection,
  ConditionStatus,
} from './types'
