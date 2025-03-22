import { Settings } from "./settings/settings-schema";

export class SettingsManager {
  settings: Settings;

  constructor(settings?: Settings) {
    this.settings = settings ?? new Settings();
  }
}
