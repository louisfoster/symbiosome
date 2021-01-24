import {Symbiosome} from "./symbiosome.js";
export class BasicExample {
  constructor() {
    this.onPush = this.onPush.bind(this);
    this.onListen = this.onListen.bind(this);
    this.onAdded = this.onAdded.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.handleDebug = this.handleDebug.bind(this);
    this.removeListener = this.removeListener.bind(this);
    this.removePortal = this.removePortal.bind(this);
    this.removeListener = this.removeListener.bind(this);
    this.onRemovedPortal = this.onRemovedPortal.bind(this);
    this.onRemovedListener = this.onRemovedListener.bind(this);
    this.isPortal = true;
    this.onPortalAdded = this.onAdded;
    this.onListenToOrigin = this.onListen;
    this.onPushedMessage = this.onPush;
    this.onPortalRemoved = this.onRemovedPortal;
    this.onListenerRemoved = this.onRemovedListener;
    this.el = {
      input_add: document.querySelector(`#input-add`),
      add: document.querySelector(`#add`),
      input_listen: document.querySelector(`#input-listen`),
      listen: document.querySelector(`#listen`),
      origin_select: document.querySelector(`#origin-select`),
      input_send: document.querySelector(`#input-send`),
      send: document.querySelector(`#send`),
      send_data: document.querySelector(`#send-data`),
      in_message: document.querySelector(`#in-message`),
      out_message: document.querySelector(`#out-message`),
      listeners: document.querySelector(`#listeners`),
      portals: document.querySelector(`#portals`)
    };
    this.el.add?.addEventListener(`click`, () => {
      this.el.input_add?.value && this.sym.addPortal(this.el.input_add.value);
    });
    this.el.listen?.addEventListener(`click`, () => {
      this.el.input_listen?.value && this.sym.listenToOrigin(this.el.input_listen.value, this.onMessage);
    });
    this.el.send?.addEventListener(`click`, () => {
      this.el.input_send?.value && this.el.origin_select?.value && this.sym.pushToOrigin(this.el.origin_select?.value, this.el.input_send?.value);
    });
    this.el.send_data?.addEventListener(`click`, () => {
      this.el.origin_select?.value && this.sym.pushToOrigin(this.el.origin_select?.value, new Float32Array([Math.random()]));
    });
    this.sym = new Symbiosome(this);
  }
  handleDebug(message, data) {
    console.log(message, data);
  }
  onPush(origin, message) {
    const msg = document.createElement(`p`);
    const writer = typeof message === `string` ? message : `${message.constructor.name} first value: ${message[0]}`;
    msg.textContent = `${new Date().toUTCString()}  --  ${origin} --  ${writer}`;
    this.el.out_message?.appendChild(msg);
  }
  removeListener(origin) {
    this.sym.removeListener(origin);
  }
  onListen(origin) {
    const msg = document.createElement(`p`);
    msg.textContent = origin;
    msg.title = `Click to remove`;
    msg.dataset.id = origin;
    msg.addEventListener(`click`, () => this.removeListener(origin));
    this.el.listeners?.appendChild(msg);
  }
  removePortal(origin) {
    this.sym.removePortal(origin);
  }
  onAdded(origin) {
    const option = document.createElement(`option`);
    option.value = origin;
    option.textContent = origin;
    this.el.origin_select?.appendChild(option);
    const msg = document.createElement(`p`);
    msg.textContent = origin;
    msg.title = `Click to remove`;
    msg.dataset.id = origin;
    msg.addEventListener(`click`, () => this.removePortal(origin));
    this.el.portals?.appendChild(msg);
  }
  onMessage(origin, message) {
    const msg = document.createElement(`p`);
    const writer = typeof message === `string` ? message : `${message.constructor.name} first value: ${message[0]}`;
    msg.textContent = `${new Date().toUTCString()}  --  ${origin} --  ${writer}`;
    this.el.in_message?.appendChild(msg);
  }
  onRemovedListener(origin) {
    this.el.listeners?.querySelector(`p[data-id="${origin}"]`)?.remove();
  }
  onRemovedPortal(origin) {
    this.el.origin_select?.querySelector(`option[value="${origin}"]`)?.remove();
    this.el.portals?.querySelector(`p[data-id="${origin}"]`)?.remove();
  }
}
