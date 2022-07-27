'use strict';

/*
  TODO:
  get prev to copy the previous statement into the current line
  get different bases to work
*/

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

    this.updateMath();

    this.loadConfig();

    this.ans = 0;

  }

  loadConfig() {
    this.config = {
      decimals: undefined,
      base: 10,
      format: 'default'
    };
    const stringConfig = localStorage.getItem('asterisk_calc_config');
    if (stringConfig !== null) {
      this.config = {...this.config,...JSON.parse(stringConfig)};
    }
  }

  saveConfig() {
    localStorage.setItem('asterisk_calc_config', JSON.stringify(this.config));
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
    this.textArea.readOnly = true;
    this.textArea.spellcheck = false;

    const buttons = [
      ['clr','del','?','2nd','fix'],
      [',','?','?','prev','type'],
      ['and','or','xor','not','base'],
      ['A','B','C','D','E'],
      ['1/x','mod','ln','Pi','F'],
      ['^2','^1/2','sin','cos','tan'],
      ['T','G','M','k','m','u','n','p'],
      ['7','8','9','(',')'],
      ['4','5','6','*','/'],
      ['1','2','3','+','-'],
      ['0','.','E','ANS','=']
    ];

    buttons.forEach(row => {
      const buttonTexts = row;
      const buttonRow = addElement(container, 'div', `gridButtonRow${buttonTexts.length}`);
      buttonTexts.forEach( buttonText => {
        const button = addElement(buttonRow, 'div', 'gridButton');
        button.innerText = buttonText;
        button.onclick = () => {const buttonName = buttonText; app.buttonClick(buttonName);};
      });
    });

    //allow keyboard use
    document.getElementsByTagName('body').item(0).onkeypress = e => this.buttonClick(e.key);

  }

  updateMath() {
    Math.and = (a, b) => a & b;
    Math.or = (a, b) => a | b;
    Math.xor = (a, b) => a ^ b;
    Math.not = (a) => ~a;
    Math.mod = (a, b) => a % b;
  }

  fixExpression(e) {
    //make trig work
    e = e.replace(/(sin|cos|tan|and|or|xor|not|mod)/g, 'Math.$1');
    //let Pi work
    e = e.replace(/Pi/g, 'Math.PI');
    //let exponenets work
    e = e.replace(/\^/g, '**');
    //let hex work
    //let binary work
    //let SI prefixes work
    [['T', '1e12'],
     ['G', '1e9'],
     ['M', '1e6'],
     ['k', '1e3'],
     ['m', '1e-3'],
     ['u', '1e-6'],
     ['n', '1e-9'],
     ['p', '1e-12']
   ].forEach( v => {
     const [prefix, value] = v;
     //number with optional decimal part followed by 0 or more spaces and the prefix
     const r = new RegExp(`([0-9]+(\\.[0-9]+)?)\\s*${prefix}`, 'g');
     e = e.replace(r, `( $1 * ${value} )`);
   });

    return e;
  }

  toFixed(value) {
    if (app.config.decimals === undefined) {
      return value;
    } else {
      return value.toFixed(app.config.decimals);
    }
  }

  formatResult(result) {
    if (isNaN(result)) { return result; }

    //handle base, decimals, and format
    if (this.config.base === 10) {
      switch (this.config.format) {
        case 'default':
          //just take whatever we have
          result = this.toFixed(result);
          break;
        case 'sci':
          result = result.toExponential(this.config.decimals);
          break;
        case 'eng':

          let exponent = parseInt(result.toExponential().split`e`[1]);
          let sign = Math.sign(result);
          let mantissa = Math.abs(result);
          let unitsCount = 0;
          if (exponent >= 0) {
            while (mantissa >= 1000) {
              mantissa /= 1000;
              exponent -= 3;
              unitsCount += 3;
            }
          } else {
            while (mantissa < 1) {
              mantissa *= 1000;
              exponent += 3;
              unitsCount -= 3;
            }
          }

          const unitPrefixes = {
            '12': 'T', '9': 'G', '6': 'M', '3': 'k', '0': '', '-3': 'm', '-6': 'u', '-9': 'n', '-12': 'p'
          };
          const prefix = unitPrefixes[unitsCount];
          if (prefix === undefined) {
            result = result.toExponential(this.config.decimals);
          } else {
            result = sign * this.toFixed(mantissa) + prefix;
          }

          break;
      }
    } else {
      result = Math.floor(result);
      result = result.toString(this.config.base);
    }
    return result;
  }

  buttonClick(name) {
    console.log('click', name);
    window.navigator.vibrate(10);

    //for some operations, prefix ANS if this is the first thing on the line
    const presumedAnsPrefixOps = '*,/,+,-,^2,^1/2'.split`,`;
    if (presumedAnsPrefixOps.indexOf(name) !== -1) {
      const finalLine = app.textArea.value.split`\n`.pop() ;
      if (finalLine.length === 0) {
        app.textArea.value += 'ANS';
      }

    }

    switch (name) {
      case 'type':
        app.config.format = {'default': 'sci', 'sci': 'eng', 'eng': 'default'}[app.config.format];
        app.saveConfig();
        app.textArea.value += `Format is now ${app.config.format}\n`;
        break;
      case 'fix':
        if (app.config.decimals === undefined) {
          app.config.decimals = 0;
        } else {
          app.config.decimals++;
          if (app.config.decimals == 11) {
            app.config.decimals = undefined;
          }
        }
        app.saveConfig();
        app.textArea.value += `Fixed decimals ${app.config.decimals === undefined ? 'default' : app.config.decimals}\n`;
        break;
      case 'clr':
        app.textArea.value = '';
        break;
      case 'del':
        if (app.textArea.value.substr(-1) !== '\n') {
          app.textArea.value = app.textArea.value.substr(0, app.textArea.value.length - 1);
        }
        break;
      case 'sin':
      case 'cos':
      case 'tan':
      case 'and':
      case 'or':
      case 'xor':
      case 'not':
      case 'mod':
      case 'ln':
        app.textArea.value += `${name}(`;
        break;
      case '^1/2':
        app.textArea.value += '^(1/2)';
        break;
      case 'Enter':
      case '=':
        let result;
        const finalLine = app.textArea.value.split`\n`.pop() ;
        console.log('finalLine', `"${finalLine}"`);
        const fixedLine = app.fixExpression(finalLine);
        console.log('eval', `"${fixedLine}"`);
        const ANS = this.ans;
        try {
          const rawResult = eval(fixedLine);
          this.ans = rawResult;
          result = this.formatResult(rawResult);
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

    app.textArea.scrollTop = 99999;

  }

}

const app = new App();
