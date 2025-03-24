import { Settings } from "./settings/settings";

export class SettingsManager {
  settings: Settings;

  constructor(settings?: Settings) {
    this.settings = settings ?? new Settings();
  }
}
