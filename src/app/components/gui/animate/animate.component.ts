import { Component, Input } from '@angular/core';
//import anime from 'animejs/lib/anime.es.js';

@Component({
  selector: 'app-animate,[app-animate]',
  templateUrl: './animate.component.html',
  styleUrls: ['./animate.component.scss']
})
export class AnimateComponent {

  @Input() fx: string;

  

}
