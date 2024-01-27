import { Component, Input, NgZone, OnInit } from '@angular/core';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { GamePlayStory } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-svg-layer',
  templateUrl: './svg-layer.component.html',
  styleUrls: ['./svg-layer.component.scss']
})
export class SvgLayerComponent implements OnInit{

  svg: Document;
  serializer: XMLSerializer;
  svgxml: string;

  @Input() story: GamePlayStory;

  constructor(
    private repository: GameRepositoryService, 
    private shared: SharedDataService,
    private ng: NgZone,
    ) {

  }
  
  ngOnInit(): void {
    this.serializer = new XMLSerializer();
    this.repository.observeResource(this.shared.getGameResourceUrl(this.story.origin.html))
    .subscribe(
      {
        next: svgsource => {
        console.log("fetch", svgsource);
        let parser = new DOMParser();
        this.svg = parser.parseFromString(this.shared.getReplaceResourceUrls(svgsource), 'text/html');
        let clickables = this.svg.getElementsByClassName('clickable');
        console.log("Clickables found = ", clickables);
        for (let index = 0; index < clickables.length; index++) {
          const clickable = clickables[index];
          clickable.addEventListener('click', (event) => {
            this.ng.run(() => {
              const target = clickable.getAttribute('data-target');
              if (target) {
                this.shared.triggerAction(target);
              }
            });
          });
        }
        // can update the Document
        // x resolve ~/ urls
        // - attach clickable events
        // - inject stateful css classes
        this.serializer.serializeToString(this.svg);
        },
        error: error => {
          console.log(`missing problem with file ${this.story.origin.html}`);
        }
    }
      
    );
    // this.asyncinit()
    // .catch(error => {
    //   console.log("Error with init", error);
    // });
  }


  async asyncinit() {
    this.serializer = new XMLSerializer();
    //const svgsource = await this.repository.fetchResource(this.shared.getGameResourceUrl(this.origin.origin.html));
    const svgsource = await this.repository.fetchResource("http://localhost/dantar/game/introduction.html");
    let parser = new DOMParser();
    this.svg = parser.parseFromString(svgsource, 'text/xml');
    // can update the Document
    // - resolve ~/ urls
    // - attach clickable events
    // - inject stateful css classes
    this.serializer.serializeToString(this.svg);
  }

}
