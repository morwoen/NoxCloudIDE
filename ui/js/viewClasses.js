export class ImageTab extends Tab {
  path = '';
  
  constructor(path) {
    super('image');
    this.path = path;
  }
}

export class EditorTab extends Tab {
  path = '';
  
  constructor(path) {
    super('editor');
    this.path = path;
  }
}

export class TerminalTab extends Tab {
  constructor() {
    super('terminal');
  }
}

export class Tab extends View {
  constructor(type) {
    super(type);
  }
}

export class Tabs extends View {
  tabs = [];
  
  constructor(tabs) {
    super('tabs');
    this.tabs = tabs;
  }
  
  insertTab(tab, index) {
    
  }
}

export class HorizontalSplit extends Split {
  constructor() {
    super('horizontal');
  }
}

export class VerticalSplit extends Split {
  constructor() {
    super('vertical');
  }
}

export class Split extends View {
  constructor(type) {
    super(type);
  }
}

class View {
  type = '';
  
  constructor(type) {
    this.type = type;  
  }
}