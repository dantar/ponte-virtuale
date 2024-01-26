import { Injectable } from '@angular/core';
import { SharedDataService } from './shared-data.service';

@Injectable({
  providedIn: 'root'
})
export class ButtonsMenuService {

  buttons: MenuButton[];
  buttonsMap: {[id :string]: MenuButton};

  constructor() {
    this.buttons = [];
    this.buttonsMap = {};
  }

  add(button: MenuButton) {
    this.buttons.push(button);
    this.buttonsMap[button.id] = button;
  }

  remove(id: string) {
    let button = this.buttonsMap[id];
    this.buttons.splice(this.buttons.indexOf(button), 1);
    delete this.buttonsMap[id];
  }

}


export class MenuButton {

  id: string;
  icon: string;
  action: (shared: SharedDataService) => void;

}