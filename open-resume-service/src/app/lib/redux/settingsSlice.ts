export const DEFAULT_FONT_COLOR = "#000000";

export type ShowForm =
  | "workExperiences"
  | "educations"
  | "projects"
  | "skills"
  | "custom";

export type GeneralSetting = "fontFamily" | "fontSize" | "documentSize" | "themeColor";

export type Settings = {
  fontFamily: string;
  fontSize: number;
  documentSize: "A4" | "LETTER" | "LEGAL";
  themeColor?: string;
  formToHeading: Record<ShowForm, string>;
  formToShow: Record<ShowForm, boolean>;
  formsOrder: ShowForm[];
  showBulletPoints: Record<ShowForm, boolean>;
};

export const initialSettings: Settings = {
  fontFamily: "Open Sans",
  fontSize: 11,
  documentSize: "A4",
  themeColor: "",
  formToHeading: {
    workExperiences: "WORK EXPERIENCE",
    educations: "EDUCATION",
    projects: "PROJECTS",
    skills: "SKILLS",
    custom: "CUSTOM",
  },
  formToShow: {
    workExperiences: true,
    educations: true,
    projects: true,
    skills: true,
    custom: true,
  },
  formsOrder: ["workExperiences", "educations", "projects", "skills", "custom"],
  showBulletPoints: {
    workExperiences: true,
    educations: true,
    projects: true,
    skills: true,
    custom: true,
  },
};

export const selectSettings = (state: { settings: Settings }) => state.settings;
export const selectFormsOrder = (state: { settings: Settings }) => state.settings.formsOrder;
export const selectShowForm = (state: { settings: Settings }, form: ShowForm) =>
  state.settings.formToShow[form];

export const changeSettings = () => ({ type: "settings/changeSettings" });
export const changeShowForm = () => ({ type: "settings/changeShowForm" });
