export class Settings {
  darkmode: boolean = false;
  constructor(initial?: Settings) {
    Object.assign(this, initial);
  }
}

export const defaultSettingsValue = new Settings();
