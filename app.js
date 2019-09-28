'use strict';

class App {
  constructor() {
    this.init();
    this.loaded = false;
  }

  init() {
    console.log('app init');

    window.onresize = this.resizeStart.bind(this);

    this.initUI();

    this.resizeEnd();

  }

  resizeStart() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(this.resizeEnd.bind(this), 500);
  }

  resizeEnd() {

  }

  initUI() {

    function addElement(parent, type, classList) {
      const newElement = document.createElement(type);
      parent.appendChild(newElement);
      if (classList !== undefined) {
        if (typeof classList === 'string') {
          classList = [classList];
        }
        classList.forEach( v => newElement.classList.add(v));
      }
      return newElement;
    }

    const container = document.getElementById('divContainer');
    const gridDisplay = addElement(container, 'div', 'gridDisplay');
    this.textArea = addElement(gridDisplay, 'textArea', 'textDisplay');

    const buttons = [
      'CLR,?,?,2nd,fix',
      '<,>,del,prev,type',
      'and,or,xor,not,base',
      'A,B,C,D,E',
      '1/x,mod,ln,Pi,F',
      '^2,^1/2,sin,cos,tan',
      'T,G,M,K,m,u,n,p',
      '7,8,9,(,)',
      '4,5,6,*,/',
      '1,2,3,+,-',
      '0,.,EXP,ANS,='
    ];

    buttons.forEach(row => {
      const buttonTexts = row.split`,`;
      const buttonRow = addElement(container, 'div', `gridButtonRow${buttonTexts.length}`);
      buttonTexts.forEach( buttonText => {
        const button = addElement(buttonRow, 'div', 'gridButton');
        button.innerText = buttonText;
        button.onclick = () => {const buttonName = buttonText; app.buttonClick(buttonName);};
      });
    });

  }

  fixExpression(e) {
    e = e.replace(/(sin|cos|tan)/g, 'Math.$1');
    e = e.replace(/Pi/g, 'Math.PI')
    return e;
  }

  buttonClick(name) {
    console.log('click', name);
    window.navigator.vibrate(10);
    switch (name) {
      case 'CLR':
        app.textArea.value = '';
        break;
      case 'sin':
      case 'cos':
      case 'tan':
        app.textArea.value += `${name}(`;
        break;
      case '=':
        let result;
        const finalLine = app.textArea.value.split`\n`.pop() ;
        console.log('finalLine', `"${finalLine}"`);
        const fixedLine = app.fixExpression(finalLine);
        console.log('eval', `"${fixedLine}"`)
        try {
          result = eval(fixedLine);
        }
        catch(error) {
          window.e = error;
          result = error.message;
        }
        console.log('result', `"${result}"`);
        app.textArea.value += `\n${result}\n`;
        break;
      default:
        app.textArea.value += name;
    }

  }

}

const app = new App();
