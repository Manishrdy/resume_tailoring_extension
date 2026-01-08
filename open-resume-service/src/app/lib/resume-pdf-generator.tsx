import path from "path";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { ResumePDF } from "components/Resume/ResumePDF";
import { initialSettings, type Settings } from "lib/redux/settingsSlice";
import type { Resume } from "lib/redux/types";

type GeneratePDFSettings = Partial<Settings>;

const FONT_FILES: Record<string, { regular: string; bold: string }> = {
  "Open Sans": {
    regular: "OpenSans-Regular.ttf",
    bold: "OpenSans-Bold.ttf",
  },
  Roboto: {
    regular: "Roboto-Regular.ttf",
    bold: "Roboto-Bold.ttf",
  },
  Lato: {
    regular: "Lato-Regular.ttf",
    bold: "Lato-Bold.ttf",
  },
};

const registerFontFamily = (fontFamily: string) => {
  const files = FONT_FILES[fontFamily];
  if (!files) {
    return;
  }
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: fontFamily,
    fonts: [
      { src: path.join(fontsDir, files.regular), fontWeight: "normal" },
      { src: path.join(fontsDir, files.bold), fontWeight: "bold" },
    ],
  });
};

const buildSettings = (settings?: GeneratePDFSettings): Settings => ({
  ...initialSettings,
  ...settings,
});

export const generatePDF = async (
  resume: Resume,
  template = "default",
  settings?: GeneratePDFSettings
) => {
  if (template !== "default") {
    throw new Error(`Unsupported template: ${template}`);
  }

  const mergedSettings = buildSettings(settings);
  registerFontFamily(mergedSettings.fontFamily);
  const document = (
    <ResumePDF resume={resume} settings={mergedSettings} isPDF={true} />
  );

  return renderToBuffer(document);
};
