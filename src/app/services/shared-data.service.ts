import { Injectable } from '@angular/core';
import { Option, GamePlay, GamePlayStory, GameScenario, PonteVirtualeService, GameCondition, GameEffect, GameOption, GamePage} from './ponte-virtuale.service';
import { Subject, lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ButtonsMenuService } from './buttons-menu.service';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {

  getPage(id: string): GamePage {
    if (this.scenario && this.scenario.pages) {
      const index = this.scenario.pages.map(p => p.id).indexOf(id);
      if (index >= 0) {
        return this.scenario.pages[index];
      }
    }
    throw new Error(`Page not found ${id}`);
  }

  gameUrl: string | null;
  scenario: GameScenario;
  play: GamePlay;
  currentStory: GamePlayStory | null;
  options: GameOption | null;

  currentPage: GamePage;

  private playChangedSource = new Subject<PlayChange>();
  playChangedOb = this.playChangedSource.asObservable();
  private scenarioReadySource = new Subject<GameScenario>();
  scenarioReadyObs = this.scenarioReadySource.asObservable();

  markChanged(change: PlayChange) {
    this.playChangedSource.next(change);
  }

  constructor(
    private pv: PonteVirtualeService,
    // LATER private audio: AudioPlayService,
    private http: HttpClient,
    public menu: ButtonsMenuService,
    private router: Router,
    // LATER private analytics: GoogleAnalyticsService,
  ) { 
    // LATER this.analytics.init(environment.gaMeasurementId);
    this.gameUrl = localStorage.getItem('ponte-virtuale-game-url');
    this.initGame();
  }
  
  initGame() {
    if (this.gameUrl) {
      this.pv.loadGameScenario(`${this.gameUrl}/game.json`)
      .then((scenario) => {
        // LATER this.analytics.event('start', 'app', 'init');
        this.scenario = scenario;
        this.loadButtons();
        this.loadPlay();
        this.loadStandardAudio();
        this.scenarioReadySource.next(scenario);
      });
    }
  }

  public setGameUrl(arg0: string) {
    this.gameUrl = arg0;
    localStorage.setItem('ponte-virtuale-game-url', this.gameUrl);
  }

  getSettings(): {[setting:string]: string} {
    if (!this.play.settings) {
      this.play.settings = {};
    }
    return this.play.settings;
  }

  putSetting(setting: string, value: string) {
    let settings = this.getSettings();
    settings[setting] = value;
    this.savePlay();
  }

  private loadButtons() {
    if (this.scenario.buttons) {
      this.scenario.buttons.forEach(b => this.menu.add({
        id: b.id, icon: b.icon, action: () => {
          this.router.navigate(b.action || []);
        }
      }));
    }
  }

  startGame() {
    this.play = new GamePlay();
    this.play.id = this.scenario.id;
    this.pv.start(this.scenario, this.play);
    this.findNextStory();
    this.options = this.getOptions();
    this.updateGui();
    this.savePlay();
  }

  resolveEffect(effect: GameEffect) {
    this.pv.applyEffect(effect, this.scenario, this.play);
    this.updateGui();
    this.savePlay();
  }

  savePlay() {
    localStorage.setItem(`ponte-virtuale-${this.scenario.id}`, JSON.stringify(this.play));
    this.markChanged({change: 'play-saved'});
  }

  deletePlay() {
    localStorage.removeItem(`ponte-virtuale-${this.scenario.id}`);
  }

  restartGame() {
    this.deletePlay();
  }

  closeWindow() {
    window.close();
  }

  clearZoomTo() {
    this.play.zoomTo = null;
  }

  setZoomTo(id: string) {
    this.scenario.locations
    .filter(l => l.id === id)
    .forEach(l => {
      this.play.zoomTo = id;
    })
  }

  loadPlay() {
    let saved = localStorage.getItem(`ponte-virtuale-${this.scenario.id}`);
    if (saved) {
      let play = JSON.parse(saved);
      if (play.id && play.id === this.scenario.id) {
        this.play = play;
      } else {
        localStorage.removeItem(`ponte-virtuale-${this.scenario.id}`);
      }
    } else {
      // LATER this.analytics.event('player', 'app', 'new');
    }
  }

  loadStandardAudio() {
    this.loadAudio('action');
  }
  loadAudio(id: string) {
    if (this.scenario.audio) {
      this.scenario.audio
      .filter(a => a.id === id)
      .forEach(a => {
        // LATER this.audio.register(id, this.getGameResourceUrl(a.src));
      })
    }
  }

  updateGui() {
    this.findNextStory();
    this.findZoomTo();
    this.options = this.getOptions();
    if (this.play.route) {
      this.router.navigate(this.play.route);
      this.play.route = null;
    }
  }

  findZoomTo() {
    if (this.play.zoomTo) {
      this.router.navigate(['mappa']);
    }
  }

  findNextStory() {
    let unpublished = this.play.story.filter(item => !item.published);
    this.currentStory = unpublished.length > 0 ? unpublished[0] : null ;
    if (this.currentStory && this.currentStory.origin && this.currentStory.origin.read) {
      // LATER this.analytics.event(this.currentStory.origin.read, 'story', 'read');
    }
  }

  readCurrentStory() {
    if (this.currentStory) {
      this.currentStory.published = true;
    }
    this.findNextStory();
    this.savePlay();
  }

  visitTappa(location: string) {
    this.pv.visit(this.scenario, this.play, location);
    this.updateGui();
    this.savePlay();
  }

  tooFarTappa(location: string) {
    this.pv.tooFar(this.scenario, this.play, location);
    this.updateGui();
    this.savePlay();
  }

  triggerAction(action: string) {
    this.pv.trigger(this.scenario, this.play, action);
    this.updateGui();
    this.savePlay();
  }

  showPage(page: string) {
    this.pv.showPage(this.scenario, this.play, page);
    this.updateGui();
    this.savePlay();
  }

  successfulChallenge() {
    this.pv.successfulChallenge(this.scenario, this.play);
    this.updateGui();
    this.savePlay();
  }

  failedChallenge() {
    this.pv.failedChallenge(this.scenario, this.play);
    this.updateGui();
    this.savePlay();
  }

  cancelChallenge() {
    this.pv.cancelChallenge(this.scenario, this.play);
    this.updateGui();
    this.savePlay();
  }

  qrCode(code: string): boolean  {
    this.pv.qr(this.scenario, this.play, code);
    this.updateGui();
    this.savePlay();
    return true;
  }

  getOptions(): GameOption {
    return this.pv.getOptions(this.scenario, this.play);
  }

  setOption(option : Option) {
    this.pv.setOption(this.play, this.scenario, option)
    this.updateGui();
    this.savePlay();
  }

  removeOptions() {
    this.options = null;
  }

  public getHtmlResource(url: string): Promise<string> {
    return lastValueFrom(
      this.http
      .get<string>(this.getGameResourceUrl(url), {responseType: 'text' as 'json'})
    ); 
  }

  public getGameResourceUrl(path: string): string {
    return path.startsWith('~/') ? path.replace('~/', `${this.gameUrl}/`) : path;
  }

  public getReplaceResourceUrls(path: string): string {
    return path.replace(/\~\//g, `${this.gameUrl}/`);
  }

  public getSvgMap(id: string): SvgMap {
    let a = this.scenario.svgmaps
    .filter(svgmap => svgmap.id === id);
    if (a.length > 0) {
      return a[0];
    }
    throw `SVG map ${id} non esiste`;
  }  

  statusCssClasses(): { [cl: string]: boolean; } {
    // to be used with [ngClass]
    let result: {[cl: string]: boolean} = {};
    this.play.tags.forEach(tag => {
      result[`tag-${tag}`] = true;
    });
    if (this.scenario.badges) {
      this.scenario.badges.forEach(badge => {
        result[`hasbadge-${badge.badge}`] = this.play.badges.includes(badge.badge);
        result[`nobadge-${badge.badge}`] = !this.play.badges.includes(badge.badge);
      });
    }
    return result;
  }

}

export class StoryChapter {

  title?: string;
  audio?: string;
  video?: string;

}

export class MapLocation {

  id: string;
  name: string;
  icon: string;
  icons: [{condition: GameCondition, icon: string}];
  lat: number;
  lon: number;
  near: boolean;
  condition: GameCondition;
  description: string;
  anchor: number[];
}

export class SvgMap {
  //{"id": "agora", "svg": "./assets/svg/agora.svg", "background": "bg", "ids": ["hall", "desk", "comics"]}
  id: string;
  svg: string;
  background: string;
  ids: string[];
}

export class PlayChange {
  change: string;
}
