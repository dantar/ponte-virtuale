import { Component, Input, OnInit } from '@angular/core';
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
    ) {

  }
  
  ngOnInit(): void {
    this.serializer = new XMLSerializer();
    this.repository.observeResource(this.shared.getGameResourceUrl(this.story.origin.html))
    .subscribe(
      svgsource => {
        console.log("fetch", svgsource);
        let parser = new DOMParser();
        this.svg = parser.parseFromString(this.shared.getReplaceResourceUrls(svgsource), 'text/html');
        // can update the Document
        // - resolve ~/ urls
        // - attach clickable events
        // - inject stateful css classes
        this.serializer.serializeToString(this.svg);
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
