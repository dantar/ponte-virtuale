import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PonteVirtualeService {

  start(scenario: GameScenario, play: GamePlay) {
    play.event = new GameEventStart();
    this.runScenarioRules(scenario, play);
  }

  runScenarioRules(scenario: GameScenario, play: GamePlay) {
    console.log("runScenarioRules", scenario, play);
    // TODO: make a rules runner, with session variables and recording effects to apply at the end of the rules run
    scenario.rules.forEach(rule => this.checkAndRunRule(rule, scenario, play));
  }

  checkAndRunRule(rule: GameRule, scenario: GameScenario, play: GamePlay): void {
    if (
      !rule.trigger || 
      GameEventTriggerAction.validEvent(rule, scenario, play) ||
      GameEventStart.validEvent(rule, scenario, play) ||
      GameEventVisit.validEvent(rule, scenario, play) ||
      GameEventTooFar.validEvent(rule, scenario, play) ||
      GameEventSuccessfulChallenge.validEvent(rule, scenario, play) ||
      GameEventFailedChallenge.validEvent(rule, scenario, play) ||
      GameEventQrCode.validEvent(rule, scenario, play) || 
      GameEventShowPage.validEvent(rule, scenario, play)
      ) {
        if(!rule.condition || this.checkCondition(rule.condition, play, scenario)) {
          if (rule.effect) {
            this.applyEffect(rule.effect, scenario, play);
          }
          if (rule.rules) {
            rule.rules.forEach(sub => this.checkAndRunRule(sub, scenario, play));
          }
        }
    }
  }

  visit(scenario: GameScenario, play: GamePlay, location: string) {
    play.event = new GameEventVisit(location);
    this.runScenarioRules(scenario, play);
  }

  tooFar(scenario: GameScenario, play: GamePlay, location: string) {
    play.event = new GameEventTooFar(location);
    this.runScenarioRules(scenario, play);
  }

  trigger(scenario: GameScenario, play: GamePlay, action: string) {
    play.event = new GameEventTriggerAction(action);
    this.runScenarioRules(scenario, play);
  }

  showPage(scenario: GameScenario, play: GamePlay, page: string) {
    play.event = new GameEventShowPage(page);
    this.runScenarioRules(scenario, play);
    const lastPage = play.currentPage;
    if (play.currentPage === lastPage) {
      // auto change page if not changed by a rule
      play.currentPage = page;
    }
  }

  successfulChallenge(scenario: GameScenario, play: GamePlay) {
    play.event = new GameEventSuccessfulChallenge(play.challenge!.challenge);
    play.challenge = null;
    this.runScenarioRules(scenario, play);
  }

  failedChallenge(scenario: GameScenario, play: GamePlay) {
    play.event = new GameEventFailedChallenge(play.challenge!.challenge);
    play.challenge = null;
    this.runScenarioRules(scenario, play);
  }

  cancelChallenge(scenario: GameScenario, play: GamePlay) {
    play.challenge = null;
  }

  qr(scenario: GameScenario, play: GamePlay, trigger: string) {
    let code = trigger;
    if (code.startsWith('http') && code.lastIndexOf('/') > 0) {
      code = code.substring(code.lastIndexOf('/') + 1);
    }
    play.event = new GameEventQrCode(code);
    this.runScenarioRules(scenario, play);
  }

  apply(rule: GameRule, scenario: GameScenario, play: GamePlay): void {
    if(this.checkCondition(rule.condition, play, scenario)) {
      this.applyEffect(rule.effect, scenario, play)
    }
  }

  checkCondition(condition: GameCondition, play:GamePlay, scenario:GameScenario): boolean {
    let check: boolean = true;
    if(GameRule.validCondition(condition)) {
      // DEBT refactor this so that each class takes care of its own code
      if (GameConditionBadge.valid(condition as GameConditionBadge)) {
        check = check && GameConditionBadge.check(condition as GameConditionBadge, play);
      }
      if (GameConditionBadges.valid(condition as GameConditionBadges)) {
        check = check && GameConditionBadges.check(condition as GameConditionBadges, play);
      }
      if (GameConditionNoBadge.valid(condition as GameConditionNoBadge)) {
        check = check && GameConditionNoBadge.check(condition as GameConditionNoBadge, play);
      }
      if (GameConditionTag.valid(condition as GameConditionTag)) {
        check = check && GameConditionTag.check(condition as GameConditionTag, play);
      }
      if (GameConditionNoTag.valid(condition as GameConditionNoTag)) {
        check = check && GameConditionNoTag.check(condition as GameConditionNoTag, play);
      }
      // logical operators require scenario and service for recursive checkCondition
      if (GameConditionNot.valid(condition as GameConditionNot)) {
        check = check && GameConditionNot.check(condition as GameConditionNot, play, scenario, this);
      }
      if (GameConditionAnd.valid(condition as GameConditionAnd)) {
        check = check && GameConditionAnd.check(condition as GameConditionAnd, play, scenario, this);
      }
      if (GameConditionOr.valid(condition as GameConditionOr)) {
        check = check && GameConditionOr.check(condition as GameConditionOr, play, scenario, this);
      }
    }
    return check;
  }

  applyEffect(effect: GameEffect, scenario: GameScenario, play: GamePlay): void {
    if (!effect.condition || this.checkCondition(effect.condition, play, scenario)) {
      GameEffect.validateAndRun(effect, scenario, play);
    }
  }

  getOptions(scenario: GameScenario, play: GamePlay): GameOption {
    let options: GameOption = new GameOption();
    if(play.options.length > 0) {
      scenario.options
      .filter((gameOption) => gameOption.id === play.options[0]) 
      .forEach((gameOption) => (options = gameOption))
      }
    return options;
  }

  setOption(play: GamePlay, scenario: GameScenario, option: Option) {
    play.options.shift();
    if (option.effect) {
      this.applyEffect(option.effect, scenario, play)
    }
    if (option.effects) {
      option.effects.forEach(effect => {
        this.applyEffect(effect, scenario, play)
      });
    }
  }
  
  constructor(
    private http: HttpClient,
  ) { }

  loadGameScenario(url: string): Promise<GameScenario> {
    return lastValueFrom(this.http.get<GameScenario>(url));
  };

}

export class GameScenario {

  id: string;
  map: GameLayerMap
  //layers: GameLayer[];
  pages?: GamePage[];
  stories: GameEffectStoryItem[];
  badges?: GameBadge[];

  rules: GameRule[];
  options: GameOption[];
  locations: MapLocation[];
  svgmaps: SvgMap[];
  audio: AudioSource[];
  buttons: MapButton[];
  challenges: GameChallenge[];
  credits: string;
  layout: string;
  fullscreen: string;
  favicon: string;

  static getStory(scenario: GameScenario, id: string): GameEffectStoryItem {
    const index = scenario.stories.map(s => s.id).indexOf(id);
    if (index >= 0) {
      return scenario.stories[index];
    }
    throw new Error(`Story not found ${id}`);
  }

}

export class MapInitData {
  user?: MapIcon;
  lat?: number;
  lon?: number;
  zoom: number;
}

export class MapIcon {
  anchor?: number[];
  icon: string;
}

function safeCapture(text: string, re: RegExp, index: number): string | null {
  const m = text.match(re);
  if (m) {
    return m[index];
  }
  return null;
}

export class GameEvent {
}

export class GameEventStart extends GameEvent {

  start = true;

  static validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    return (play.event as GameEventStart).start && rule.trigger === 'start';
  }

}

export class GameEventVisit {

  visitlocation: string;

  constructor(location: string) {
    this.visitlocation = location;
  }

  static validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventVisit);
    let r = /visit:(.*)/;
    return !!(event.visitlocation && safeCapture(rule.trigger, r, 1) === event.visitlocation);
  }

}

export class GameEventTooFar {

  toofarlocation: string;

  constructor(location: string) {
    this.toofarlocation = location;
  }

  static validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventTooFar);
    let r = /toofar:(.*)/;
    return !!(event.toofarlocation && safeCapture(rule.trigger, r, 1) === event.toofarlocation);
  }

}

export class GameEventTriggerAction {

  action: string;

  constructor(action: string) {
    this.action = action;
  }

  static validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventTriggerAction);
    let r = /action:(.*)/;
    return !!(event.action && safeCapture(rule.trigger, r, 1) === event.action);
  }

}

export class GameEventShowPage {

  page: string;

  constructor(page: string) {
    this.page = page;
  }

  static validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventShowPage);
    let r = /page:(.*)/;
    return !!(event.page && safeCapture(rule.trigger, r, 1) === event.page);
  }

}

export class GameEventSuccessfulChallenge {

  success: string;

  constructor(challenge: string) {
    this.success = challenge;
  }

  static validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventSuccessfulChallenge);
    let r = /success:(.*)/;
    return !!(event.success && safeCapture(rule.trigger, r, 1) === event.success);
  }

}

export class GameEventFailedChallenge {

  failed: string;

  constructor(challenge: string) {
    this.failed = challenge;
  }

  static validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventFailedChallenge);
    let r = /failed:(.*)/;
    return !!(event.failed && safeCapture(rule.trigger, r, 1) === event.failed);
  }

}

export class GameEventQrCode {

  qrcode: string;

  constructor(qrcode: string) {
    this.qrcode = qrcode;
  }

  static validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventQrCode);
    let r = /qrcode:(.*)/;
    return !!(event.qrcode && safeCapture(rule.trigger, r, 1) === event.qrcode);
  }

}

export class GameRule {

  trigger: string;
  effect: GameEffect;
  condition: GameCondition;
  rules: GameRule[];

  static validCondition(condition: GameCondition) {
    return condition ? true : false;
  }
}

export class GameCondition {
  
  nobadge: string;
  enabled: boolean;
}

export class GameConditionBadge extends GameCondition {
  badge: string;

  static valid(condition: GameConditionBadge) {
    return condition.badge ? true : false;
  }

  static check(condition: GameConditionBadge, play: GamePlay) : boolean {
    return play.badges.includes(condition.badge);
  }

}
export class GameConditionBadges extends GameCondition {
  badges: string[];

  static valid(condition: GameConditionBadges) {
    return condition.badges ? true : false;
  }

  static check(condition: GameConditionBadges, play: GamePlay) : boolean {
    return condition.badges
    .filter(badge => !play.badges.includes(badge))
    .length === 0;
  }

}

export class GameConditionNoBadge extends GameCondition {
  override nobadge: string;

  static valid(condition: GameConditionNoBadge) {
    return condition.nobadge ? true : false;
  }

  static check(condition: GameConditionNoBadge, play: GamePlay) : boolean {
    return !play.badges.includes(condition.nobadge);;
  }
  
}

export class GameConditionTag extends GameCondition {
  tag: string;

  static valid(condition: GameConditionTag) {
    return condition.tag ? true : false;
  }

  static check(condition: GameConditionTag, play: GamePlay) : boolean {
    return play.tags.includes(condition.tag);
  }

}

export class GameConditionNoTag extends GameCondition {
  noTag: string;

  static valid(condition: GameConditionNoTag) {
    return condition.noTag ? true : false;
  }

  static check(condition: GameConditionNoTag, play: GamePlay) : boolean {
    return !play.tags.includes(condition.noTag);
  }
  
}

export class GameConditionNot extends GameCondition {
  not: GameCondition;

  static valid(condition: GameConditionNot) {
    return condition.not ? true : false;
  }

  static check(condition: GameConditionNot, play: GamePlay, scenario: GameScenario, service: PonteVirtualeService) : boolean {
    return !(service.checkCondition(condition.not, play, scenario));
  }

}

export class GameConditionAnd extends GameCondition {
  and: GameCondition[];

  static valid(condition: GameConditionAnd) {
    return condition.and && condition.and.length > 0 ? true : false;
  }

  static check(condition: GameConditionAnd, play: GamePlay, scenario: GameScenario, service: PonteVirtualeService) : boolean {
    let result = true;
    for (let index = 0; index < condition.and.length; index++) {
      result = result && service.checkCondition(condition.and[index], play, scenario);
      
    }
    return result;
  }

}

export class GameConditionOr extends GameCondition {
  or: GameCondition[];

  static valid(condition: GameConditionOr) {
    return condition.or && condition.or.length > 0 ? true : false;
  }

  static check(condition: GameConditionOr, play: GamePlay, scenario: GameScenario, service: PonteVirtualeService) : boolean {
    let result = false;
    for (let index = 0; index < condition.or.length; index++) {
      result = result || service.checkCondition(condition.or[index], play, scenario);
      
    }
    return result;
  }

}


// GameEffect

export class GameEffect {
  condition?: GameCondition;
  static _effects: typeof GameEffect[] = [];
  static register(effectClass: typeof GameEffect) {
    this._effects.push(effectClass);
  }
  static run(effect: GameEffect, scenario: GameScenario, play: GamePlay) {}
  static valid(effect: GameEffect): boolean {
    return false;
  }
  static validateAndRun(effect: GameEffect, scenario: GameScenario, play: GamePlay) {
    this._effects.forEach(ec => {
      if (ec.valid(effect)) {
        ec.run(effect, scenario, play);
      }
    });
  }
}

export class GameEffectStory extends GameEffect {
  story: string | GameEffectStoryItem[];
  static override run(effect: GameEffectStory, scenario: GameScenario, play: GamePlay) {
    if (typeof effect.story === 'string') {
      play.story.push(({origin: GameScenario.getStory(scenario, effect.story as string), published: false} as GamePlayStory));
    } else {
      for (let index = 0; index < effect.story.length; index++) {
        const element = effect.story[index];      
        play.story.push(({origin: element, published: false} as GamePlayStory));
      }
    }
  }
  static override valid(effect: GameEffectStory) {
    return effect.story ? true : false;
  }
}
export class GameEffectStoryItem {
  id?: string;
  html: string;
  read?: string;
  video?: string;
}
GameEffect.register(GameEffectStory);

export class GameEffectBadge extends GameEffect {
  badge: string;
  static override run(effect: GameEffectBadge, scenario: GameScenario, play: GamePlay) {
    if (!play.badges.includes(effect.badge)) play.badges.push(effect.badge);
  }
  static override valid(effect: GameEffectBadge): boolean {
    return effect.badge ? true : false;
  }
}
GameEffect.register(GameEffectBadge);

export class GameEffectTag extends GameEffect {
  tag: string;
  static override run(effect: GameEffectTag, scenario: GameScenario, play: GamePlay) {
    if (!play.tags.includes(effect.tag)) play.tags.push(effect.tag);
  }
  static override valid(effect: GameEffectTag) {
    return effect.tag ? true : false;
  }
}
GameEffect.register(GameEffectTag);

export class GameEffectChallenge extends GameEffect {
  challenge: string;
  static override run(effect: GameEffectChallenge, scenario: GameScenario, play: GamePlay) {
    scenario.challenges
    .filter(challenge => challenge.id === effect.challenge)
    .forEach(challenge => {
      GameChallenge.initPlay(challenge, scenario, play);
    })
  }
  static override valid(effect: GameEffectChallenge) {
    return effect.challenge ? true : false;
  }
}
GameEffect.register(GameEffectChallenge);

export class GameEffectGoToLocation extends GameEffect {
  location: string;
  static override run(effect: GameEffectGoToLocation, scenario: GameScenario, play: GamePlay) {
    scenario.locations
    .filter(l => l.id === effect.location)
    .forEach(l => {
      play.zoomTo = effect.location;
    });
  }
  static override valid(effect: GameEffectGoToLocation) {
    return effect.location ? true : false;
  }
}
GameEffect.register(GameEffectGoToLocation);

export class GameEffectShowPage extends GameEffect {
  page: string;
  static override run(effect: GameEffectShowPage, scenario: GameScenario, play: GamePlay) {
    console.log('GameEffectPage', play);
    play.currentPage = effect.page;
  }
  static override valid(effect: GameEffectShowPage) {
    return effect.page ? true : false;
  }
}
GameEffect.register(GameEffectShowPage);

export class GameEffectRoute extends GameEffect {
  route: string[];
  static override run(effect: GameEffectRoute, scenario: GameScenario, play: GamePlay) {
    play.route = effect.route.map(s => s);
  }
  static override valid(effect: GameEffectRoute) {
    return effect.route ? true : false;
  }
}
GameEffect.register(GameEffectRoute);

export class GameEffectScore extends GameEffect {
 score: number;
  static override run(effect: GameEffectScore, scenario: GameScenario, play: GamePlay) {
    play.score += effect.score;
  }
  static override valid(effect: GameEffectScore) {
    return effect.score ? true : false;
  }
}
GameEffect.register(GameEffectScore);

export class GameEffectOptions extends GameEffect {
  options: string;
  static override run(effect: GameEffectOptions, scenario: GameScenario, play: GamePlay) {
    if (!play.options.includes(effect.options)) play.options.push(effect.options);
  }
  static override valid(effect: GameEffectOptions) {
    return effect.options ? true : false;
  }
}
GameEffect.register(GameEffectOptions);

export class GamePlay {
  
  id: string;
  currentPage?: string;

  story: GamePlayStory[];
  badges: string[];
  options: string[];
  score: number;
  zoomTo: string | null;
  tags: string[];
  event: GameEvent;
  challenge: GameChallengeData|null;
  route: string[]|null;
  settings: {[setting:string]: string};

  constructor() {
    this.story = [];
    this.badges = [];
    this.options = [];
    this.score = 0;
    this.tags= [];
    this.challenge = null;
    this.route = null;
    this.settings = {};
  }
}

export class GameLayer {
  id: string;
  code: string;
  page?: GamePage | string;
}

export class GameLayerMap extends GameLayer {
  override code = 'map';
  conf?: MapInitData;
  icons: GameLayerIcon[];
  features: MapLocation[];
}
export class GameLayerIcon {
  id: string;
  url: string;
  size?: number[];
  anchor?: number[];
}

export class GamePage {
  id: string;
  code: 'map' | 'html' | 'svg';
  url: string;
}

export class GamePlayStory {
  origin: GameEffectStoryItem;
  published: boolean;
}


export class GameBadge {
  badge: string;
  src: string;
}

export class GameOption {
  id: string;
  read: string;
  options: Option[];
  free: boolean;
}

export class Option {
  text: string;
  texts: string[];
  effect: GameEffect;
  effects: GameEffect[];
}

export class GameChallenge {
  static initPlay(challenge: GameChallenge, scenario: GameScenario, play: GamePlay) {
    if ( GameChallengePlaceFeatures.check(challenge as GameChallengePlaceFeatures) ) {
      GameChallengePlaceFeatures.init(challenge, scenario, play);
    }
    if ( GameChallengeIdentikit.check(challenge as GameChallengeIdentikit) ) {
      GameChallengeIdentikit.init(challenge, scenario, play);
    }
  }
  id: string;
  code: string;
}
export class GameChallengeData {
  challenge: string;
  constructor(challenge: GameChallenge) {
    this.challenge = challenge.id;
  }  
}

export class GameChallengePlaceFeatures extends GameChallenge {
  svgmap: string;
  override code: 'features';
  success: string[];
  static check(challenge: GameChallengePlaceFeatures): boolean {
    return challenge.code === 'features';
  }
  static init(challenge: GameChallenge, scenario: GameScenario, play: GamePlay) {
    play.challenge = {challenge: challenge.id, guess: {}} as GameChallengeData;
  }
}
export class PlaceFeature {
  id: string;
  present: boolean;
  image?: string;
}
export class GameChallengePlaceFeaturesGuess extends GameChallengeData {
  guess: {[id: string]: boolean};
}

export class GameChallengeIdentikit extends GameChallenge {
  svgmap: string;
  override code: 'identikit';
  options: GameChallengeIdentikitOption[]
  static check(challenge: GameChallengeIdentikit): boolean {
    return challenge.code === 'identikit';
  }
  static init(challenge: GameChallenge, scenario: GameScenario, play: GamePlay) {
    play.challenge = new GameChallengeIdentikitData(challenge as GameChallengeIdentikit);
  }
}
export class GameChallengeIdentikitOption {
  id: string;
  options: number;
  success: number; 
}
export class GameChallengeIdentikitData extends GameChallengeData {
  options: {[id: string]: number};
  constructor(challenge: GameChallengeIdentikit) {
    super(challenge);
    this.options = {}
    if (challenge.options) {
      challenge.options
      .forEach(option => this.options[option.id] = 1);
    }
  }
}

export class MapButton {

  id: string;
  icon: string;
  action?: string[];
  href?: string;
  layout?: string;

}

export class AudioSource {

  id: string;
  src: string;

}

export class MapLocation {

  id: string;
  name: string;
  icon?: string | GameLayerIcon;
  icons: [{condition: GameCondition, icon: string}];
  pos?: number[];
  lat: number; // obsolete?
  lon: number; // obsolete?
  near: boolean;
  condition: GameCondition;
  description: string;
  anchor: number[];

}

export class MapFeaturePolyline extends MapLocation{
  polyline: string[];
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
