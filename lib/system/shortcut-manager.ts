type ShortcutHandler = (event: KeyboardEvent) => void;

type KeyModifiers = {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

type Shortcut = {
  key: string;
  modifiers: KeyModifiers;
};

class ShortcutManager {
  private shortcuts = new Map<string, ShortcutHandler[]>();
  private keyMappings: Shortcut[] = [];
  private currentShortcut: Partial<Shortcut> = {};

  constructor() {
    if (typeof window !== "undefined") {
      this.handleKeyPress = this.handleKeyPress.bind(this);
      window.addEventListener("keydown", this.handleKeyPress);
    }
  }

  private handleKeyPress(event: KeyboardEvent) {
    const shortcutKey = this.getShortcutString({
      key: event.key.toLowerCase(),
      modifiers: {
        ctrl: event.ctrlKey || event.metaKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      },
    });

    this.shortcuts.get(shortcutKey)?.forEach((handler) => handler(event));
  }

  private getShortcutString(shortcut: Shortcut): string {
    const keys = [];
    if (shortcut.modifiers.ctrl) keys.push("CmdOrCtrl");
    if (shortcut.modifiers.shift) keys.push("Shift");
    if (shortcut.modifiers.alt) keys.push("Alt");
    if (shortcut.modifiers.meta) keys.push("Meta");
    keys.push(shortcut.key);
    return keys.join("+");
  }

  public registerShortcut(handler: ShortcutHandler) {
    this.currentShortcut = { modifiers: {} };
    return this.createShortcutBuilder(handler);
  }

  private createShortcutBuilder(handler: ShortcutHandler) {
    return {
      ctrl: () => {
        this.currentShortcut.modifiers!.ctrl = true;
        return this.createShortcutBuilder(handler);
      },
      shift: () => {
        this.currentShortcut.modifiers!.shift = true;
        return this.createShortcutBuilder(handler);
      },
      alt: () => {
        this.currentShortcut.modifiers!.alt = true;
        return this.createShortcutBuilder(handler);
      },
      meta: () => {
        this.currentShortcut.modifiers!.meta = true;
        return this.createShortcutBuilder(handler);
      },
      key: (key: string) => {
        this.currentShortcut.key = key.toLowerCase();
        return this.storeShortcut(handler);
      },
    };
  }

  private storeShortcut(handler: ShortcutHandler): string {
    const shortcutString = this.getShortcutString(
      this.currentShortcut as Shortcut,
    );
    if (!this.shortcuts.has(shortcutString)) {
      this.shortcuts.set(shortcutString, []);
    }
    this.shortcuts.get(shortcutString)?.push(handler);
    this.keyMappings.push(this.currentShortcut as Shortcut);
    return shortcutString;
  }

  public unregisterShortcut(shortcutString: string, handler: ShortcutHandler) {
    const handlers = this.shortcuts
      .get(shortcutString)
      ?.filter((h) => h !== handler);
    if (handlers && handlers.length) {
      this.shortcuts.set(shortcutString, handlers);
    } else {
      this.shortcuts.delete(shortcutString);
    }
    this.keyMappings = this.keyMappings.filter(
      (s) => this.getShortcutString(s) !== shortcutString,
    );
  }

  public getKeyMappings(): Shortcut[] {
    return [...this.keyMappings];
  }

  public destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyPress);
      this.shortcuts.clear();
      this.keyMappings = [];
    }
  }
}

export const shortcutManager = new ShortcutManager();
