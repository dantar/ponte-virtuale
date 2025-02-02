import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GeoJSONOptions } from 'leaflet';
import { lastValueFrom } from 'rxjs';
import { IfTypeOf } from './if-type-of.service';

@Injectable({
  providedIn: 'root'
})
export class PonteVirtualeService {

  private registryOfConditionEvaluators: ConditionEvaluator[] = [];

  registerConditionEvaluator(condition: GameCondition, callback: (play :GamePlay, scenario: GameScenario) => void): ConditionEvaluator {
    const evaluator = new ConditionEvaluator(condition, callback);
    this.registryOfConditionEvaluators.push(evaluator);
    console.log("Rgistered ConditionEvaluator", evaluator);
    return evaluator;
  }

  start(scenario: GameScenario, play: GamePlay) {
    play.event = new GameEventStart();
    this.runScenarioRules(scenario, play);
  }

  runScenarioRules(scenario: GameScenario, play: GamePlay) {
    console.log("runScenarioRules", scenario, play);
    // TODO: make a rules runner, with session variables and recording effects to apply at the end of the rules run
    play.clipboard = {}; // reset clipboard
    scenario.rules.forEach(rule => this.checkAndRunRule(rule, scenario, play));
    this.registryOfConditionEvaluators.forEach(evaluator => {
      if (this.checkCondition(evaluator.condition, play, scenario)) {
        evaluator.callback(play, scenario);
      }
    });
  }

  checkAndRunRule(rule: GameRule, scenario: GameScenario, play: GamePlay): void {
    if (!rule.trigger || GameEvent.validEvent(rule, scenario, play)) {
        if(!rule.condition || this.checkCondition(rule.condition, play, scenario)) {
          this.runAllRuleEffects(rule, scenario, play);
        }
    }
  }

  private runAllRuleEffects(rule: GameRule, scenario: GameScenario, play: GamePlay) {
    if (rule.effect) {
      this.runRuleEffect(rule, scenario, play);
    }
    if (rule.switch) {
      this.runRuleSwitch(rule, scenario, play);
    }
    if (rule.rules) {
      rule.rules.forEach(sub => this.checkAndRunRule(sub, scenario, play));
    }
  }
  
  private runRuleSwitch(rule: GameRule, scenario: GameScenario, play: GamePlay) {
    for (let index = 0; index < rule.switch.length; index++) {
      const effect = rule.switch[index];
      if (!effect.condition || this.checkCondition(effect.condition, play, scenario)) {
        this.applyEffect(effect, scenario, play);
        break;
      } 
    }
  }

  private runRuleEffect(rule: GameRule, scenario: GameScenario, play: GamePlay) {
    if (Array.isArray(rule.effect)) {
      rule.effect.forEach(effect => this.applyEffect(effect, scenario, play));
    } else {
      this.applyEffect(rule.effect, scenario, play);
    }
  }

  visit(scenario: GameScenario, play: GamePlay, location: string) {
    play.event = new GameEventVisit().setLocation(location);
    this.runScenarioRules(scenario, play);
  }

  moving(scenario: GameScenario, play: GamePlay, latitude: number, longitude: number): boolean {
    class NearestFound {
      id: string;
    }
    let nearest: MapLocation | undefined = undefined;
    let threshold = 1;
    scenario.locations.forEach(location => {
      let distance = (location.lat - latitude) *  (location.lat - latitude) + (location.lon - longitude) * (location.lon - longitude);
      if (distance < threshold) {
        threshold = distance;
        nearest = location;
      }
    });
    if (nearest != play.nearest) {
      play.nearest = nearest;
      if (nearest) {
        play.event = new GameEventNear().setLocation(nearest.id);
        this.runScenarioRules(scenario, play);
      }
      return true;
    }
    return false;
  }

  trigger(scenario: GameScenario, play: GamePlay, action: string) {
    play.event = new GameEventTriggerAction().setAction(action);
    this.runScenarioRules(scenario, play);
  }

  gameEvent(scenario: GameScenario, play: GamePlay, event: GameEvent) {
    play.event = event;
    this.runScenarioRules(scenario, play);
  }

  showPage(scenario: GameScenario, play: GamePlay, page: string) {
    play.event = new GameEventShowPage().setPage(page);
    this.runScenarioRules(scenario, play);
    const lastPage = play.currentPage;
    if (play.currentPage === lastPage) {
      // auto change page if not changed by a rule
      play.currentPage = page;
    }
  }

  showStory(scenario: GameScenario, play: GamePlay, story: string) {
    play.story.push(({origin: GameScenario.getStory(scenario, story), published: false} as GamePlayStory));
  }

  qr(scenario: GameScenario, play: GamePlay, trigger: string) {
    let code = trigger;
    if (code.startsWith('http') && code.lastIndexOf('/') > 0) {
      code = code.substring(code.lastIndexOf('/') + 1);
    }
    play.event = new GameEventQrCode().setCode(code);
    this.runScenarioRules(scenario, play);
  }

  apply(rule: GameRule, scenario: GameScenario, play: GamePlay): void {
    if(this.checkCondition(rule.condition, play, scenario)) {
      if (Array.isArray(rule.effect)) {
        rule.effect.forEach(effect => this.applyEffect(effect, scenario, play));
      } else {
        this.applyEffect(rule.effect, scenario, play);
      }
    }
  }

  checkCondition(condition: GameCondition, play:GamePlay, scenario:GameScenario): boolean {
    let check: boolean = true;
    if(GameRule.validCondition(condition)) {
      // DEBT refactor this so that each class takes care of its own code
      if (GameConditionFormValue.valid(condition as GameConditionFormValue)) {
        check = check && GameConditionFormValue.check(condition as GameConditionFormValue, play);
      }
      if (GameConditionSettingsValue.valid(condition as GameConditionSettingsValue)) {
        check = check && GameConditionSettingsValue.check(condition as GameConditionSettingsValue, play);
      }
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

export class ConditionEvaluator {

  uuid: string;
  condition: GameCondition;
  callback: (play :GamePlay, scenario: GameScenario) => void;

  constructor(condition: GameCondition, callback: (play :GamePlay, scenario: GameScenario) => void) {
    this.condition = condition;
    this.callback = callback;
    this.uuid = crypto.randomUUID();
  }

}

export class GameScenario {

  id: string;
  map: GameLayerMap;
  desktop?: string;
  //layers: GameLayer[];
  pages?: GamePage[];
  scanners?: GameQrScanner[];
  stories: GameEffectStoryItem[];
  badges?: GameBadge[];
  stylesheet?: string | string[];

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
  static runRegex(event: GameEvent, regex: string): {[key: string]: string} {
    return {};
  }
  static runAllRegex(event: GameEvent, regex: string): {[key: string]: string} {
    let result:{[key: string]: string} = {};
    for (let index = 0; index < this._events.length; index++) {
      const element = this._events[index];
      result = {...result, ...element.runRegex(event, regex)};
    }
    return result;
  }
  static _events: typeof GameEvent[] = [];
  static register(eventClass: typeof GameEvent) {
    this._events.push(eventClass);
  }
  static validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    for (let index = 0; index < this._events.length; index++) {
      const element = this._events[index];
      if (element.validEvent(rule, scenario, play)) {
        return true;
      };
    }
    return false;
  }

}

export class GameEventStart extends GameEvent {

  start = true;

  static override validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    return (play.event as GameEventStart).start && rule.trigger === 'start';
  }

}
GameEvent.register(GameEventStart);

export class GameEventVisit extends GameEvent {

  visitlocation: string;

  setLocation(location: string): GameEvent {
    this.visitlocation = location;
    return this;
  }

  static override validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventVisit);
    let r = /visit:(.*)/;
    return !!(event.visitlocation && safeCapture(GamePlay.replaceValues(play, rule.trigger), r, 1) === event.visitlocation);
  }

}
GameEvent.register(GameEventVisit);

export class GameEventNear extends GameEvent {

  near: string;

  setLocation(location: string): GameEvent {
    this.near = location;
    return this;
  }

  static override validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventNear);
    let r = /near:(.*)/;
    return !!(event.near && safeCapture(GamePlay.replaceValues(play, rule.trigger), r, 1) === event.near);
  }

}
GameEvent.register(GameEventNear);

export class GameEventTriggerAction extends GameEvent {

  action: string;

  setAction(action: string): GameEventTriggerAction {
    this.action = action;
    return this;
  }

  static override validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventTriggerAction);
    let r = /action:(.*)/;
    return !!(event.action && safeCapture(GamePlay.replaceValues(play, rule.trigger), r, 1) === event.action);
  }
  static override runRegex(event: GameEventTriggerAction, re: string): {[key: string]: string} {
    let match = new RegExp(re).exec(event.action);
    if (match && match.groups) {
      return match.groups;
    }
    return {};
  }

}
GameEvent.register(GameEventTriggerAction)

export class GameEventShowPage extends GameEvent {

  page: string;

  setPage(page: string): GameEventShowPage {
    this.page = page;
    return this;
  }

  static override validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventShowPage);
    let r = /page:(.*)/;
    return !!(event.page && safeCapture(GamePlay.replaceValues(play, rule.trigger), r, 1) === event.page);
  }

}
GameEvent.register(GameEventShowPage)

export class GameEventQrCode extends GameEvent {

  qrcode: string;

  setCode(qrcode: string): GameEventQrCode {
    this.qrcode = qrcode;
    return this;
  }

  static override validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventQrCode);
    let r = /qrcode:(.*)/;
    return !!(event.qrcode && safeCapture(GamePlay.replaceValues(play, rule.trigger), r, 1) === event.qrcode);
  }
  static override runRegex(event: GameEventQrCode, re: string): {[key: string]: string} {
    let match = new RegExp(re).exec(event.qrcode);
    if (match && match.groups) {
      return match.groups;
    }
    return {};
  }

}
GameEvent.register(GameEventQrCode)

export class GameEventSubmitForm extends GameEvent {

  tag: string;
  form: {[id: string]: any} = {};

  static override validEvent(rule: GameRule, scenario: GameScenario, play: GamePlay): boolean {
    let event = (play.event as GameEventSubmitForm);
    let r = /submit:(.*)/;
    return !!(event.tag && safeCapture(GamePlay.replaceValues(play, rule.trigger), r, 1) === event.tag);
  }
  static override runRegex(event: GameEventSubmitForm, re: string): {[key: string]: string} {
    let match = new RegExp(re).exec(event.tag);
    if (match && match.groups) {
      return match.groups;
    }
    return {};
  }

}
GameEvent.register(GameEventSubmitForm)

export class GameRule {

  trigger: string;
  effect: GameEffect | GameEffect[];
  switch: GameEffect[];
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

export class GameConditionFormValue extends GameCondition {

  formvalue: string;
  equals?: string;

  static valid(condition: GameConditionFormValue) {
    return condition.formvalue ? true : false;
  }

  static check(condition: GameConditionFormValue, play: GamePlay) : boolean {
    const event = play.event as GameEventSubmitForm;
    if (condition.equals && event.form) {
      let t = GamePlay.replaceValues(play, condition.equals);
      Object.keys(event.form).forEach(k => t = t
        .replaceAll(`{{${k}}}`, event.form[k])
        .replaceAll(`__${k}__`, event.form[k])
      );
      return event.form && event.form[condition.formvalue] == t;
    }
    return false;
  }

}

export class GameConditionSettingsValue extends GameCondition {

  setting: string;
  equals?: string;

  static valid(condition: GameConditionSettingsValue) {
    return condition.setting ? true : false;
  }

  static check(condition: GameConditionSettingsValue, play: GamePlay) : boolean {
    let v = play.settings[condition.setting];
    return (v ? GamePlay.replaceValues(play, v): '') == condition.equals;
  }

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

export class GameConditionSettings extends GameCondition {

  settings?: {[id:string]: string | string[]};

  static valid(condition: GameConditionSettings) {
    return condition.settings ? true : false;
  }

  static check(condition: GameConditionSettings, play: GamePlay) : boolean {
    return Object.keys(condition.settings || {})
      .filter(k => {
        IfTypeOf.build()
        .ifArray((a) => !a.includes(play.settings[k]))
        .ifString(s => s != play.settings[k])
        .of(condition.settings && condition.settings[k])
      }).length == 0 ;
  }

}

export class GameConditionTag extends GameCondition {
  tag: string;

  static valid(condition: GameConditionTag) {
    return condition.tag ? true : false;
  }

  static check(condition: GameConditionTag, play: GamePlay) : boolean {
    return play.tags.includes(GamePlay.replaceValues(play, condition.tag));
  }

}

export class GameConditionNoTag extends GameCondition {
  noTag: string;

  static valid(condition: GameConditionNoTag) {
    return condition.noTag ? true : false;
  }

  static check(condition: GameConditionNoTag, play: GamePlay) : boolean {
    return !play.tags.includes(GamePlay.replaceValues(play, condition.noTag));
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
  more?: GameEffect | GameEffect[];
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

export class GameEffectSettings extends GameEffect {
  settings: {[key:string]: string};
  static override run(effect: GameEffectSettings, scenario: GameScenario, play: GamePlay) {
    if (!play.settings) {
      play.settings = {};
    }
    let more: {[id: string]: string} = {};
    Object.keys(effect.settings).forEach(k =>
      more[GamePlay.replaceValues(play, k)] = GamePlay.replaceValues(play, effect.settings[k])
    );
    play.settings = {...play.settings, ...more};
  }
  static override valid(effect: GameEffectSettings) {
    return effect.settings ? true : false;
  }
}
GameEffect.register(GameEffectSettings);

export class GameEffectClipboard extends GameEffect {
  clipboard: {regex?: string};
  static override run(effect: GameEffectClipboard, scenario: GameScenario, play: GamePlay) {
    if (!play.clipboard) {
      play.clipboard = {};
    }
    if (effect.clipboard.regex) {
      let captures = GameEvent.runAllRegex(play.event, effect.clipboard.regex);
      //let captures = new RegExp(effect.clipboard.regex).exec(GameEvent.runRegex(play.event, effect.clipboard.regex));
      play.clipboard = {...play.clipboard, ...captures};
    }
  }
  static override valid(effect: GameEffectClipboard) {
    return effect.clipboard ? true : false;
  }
}
GameEffect.register(GameEffectClipboard);

export class GameEffectStory extends GameEffect {
  story: string | GameEffectStoryItem[];
  static override run(effect: GameEffectStory, scenario: GameScenario, play: GamePlay) {
    new IfTypeOf()
    .ifString((s) => play.story.push(({origin: GameScenario.getStory(scenario, GamePlay.replaceValues(play, s)), published: false} as GamePlayStory)))
    .ifArray<GameEffectStoryItem>( (a) => a.forEach(element => play.story.push(({origin: element, published: false} as GamePlayStory))) )
    .of(effect.story);
  }
  static override valid(effect: GameEffectStory) {
    return effect.story ? true : false;
  }
}
export class GameEffectStoryItem {
  id?: string;
  url: string;
  read?: string;
  video?: string;
  template?: string;
  data?: {[id:string]: number|string};
}
GameEffect.register(GameEffectStory);

export class GameEffectTag extends GameEffect {
  tag: string | string[];
  static override run(effect: GameEffectTag, scenario: GameScenario, play: GamePlay) {
    let _addTag = (play: GamePlay, tag: string) => {
      let t = GamePlay.replaceValues(play, tag);
      if (!play.tags.includes(t)) play.tags.push(t);
    };
    IfTypeOf.build()
    .ifArray<string>((a) => a.forEach(t => _addTag(play, t)))
    .ifString(t => _addTag(play, t))
    .of(effect.tag)
  }
  static override valid(effect: GameEffectTag) {
    return effect.tag ? true : false;
  }
}
GameEffect.register(GameEffectTag);

export class GameEffectUntag extends GameEffect {
  untag: string | string[];
  static override run(effect: GameEffectUntag, scenario: GameScenario, play: GamePlay) {
    let _removeTag = (play: GamePlay, tag: string) => {
      let t = GamePlay.replaceValues(play, tag);
      if (play.tags.includes(t)) play.tags.splice(play.tags.indexOf(t), 1);
    };
    IfTypeOf.build()
    .ifArray<string>((a) => a.forEach(t => _removeTag(play, t)))
    .ifString(t => _removeTag(play, t))
    .of(effect.untag)
  }
  static override valid(effect: GameEffectUntag) {
    return effect.untag ? true : false;
  }
}
GameEffect.register(GameEffectUntag);

export class GameEffectGoToLocation extends GameEffect {
  zoomto: string;
  static override run(effect: GameEffectGoToLocation, scenario: GameScenario, play: GamePlay) {
    play.zoomTo = effect.zoomto? GamePlay.replaceValues(play, effect.zoomto): null;
  }
  static override valid(effect: GameEffectGoToLocation) {
    return Object.keys(effect).includes('zoomto');
  }
}
GameEffect.register(GameEffectGoToLocation);

export class GameEffectShowPage extends GameEffect {
  page: string;
  static override run(effect: GameEffectShowPage, scenario: GameScenario, play: GamePlay) {
    play.currentPage = effect.page ? GamePlay.replaceValues(play, effect.page): undefined;
  }
  static override valid(effect: GameEffectShowPage) {
    return Object.keys(effect).includes('page');
  }
}
GameEffect.register(GameEffectShowPage);

export class GameEffectQrScanner extends GameEffect {
  scanner: string;
  static override run(effect: GameEffectQrScanner, scenario: GameScenario, play: GamePlay) {
    play.currentScanner = effect.scanner;
  }
  static override valid(effect: GameEffectQrScanner) {
    return effect.scanner ? true : false;
  }
}
GameEffect.register(GameEffectQrScanner);

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
  score: number | {variable: string, value: number};
  variable: number | {variable: string, value: number|string};
  static override run(effect: GameEffectScore, scenario: GameScenario, play: GamePlay) {
    new IfTypeOf()
    .ifInstanceOf<{variable: string, value: number}>((o) => {
      new IfTypeOf()
      .ifNumber((n) => play.variables[o.variable] = o.value + n)
      .of(play.variables[o.variable]);
    })
    .ifNumber((n) => play.score += n)
    .of(effect.score);
    new IfTypeOf()
    .ifInstanceOf<{variable: string, value: number|string}>((o) => play.variables[o.variable] = o.value)
    .ifNumber((n) => play.score = n)
    .of(effect.variable);
  }
  static override valid(effect: GameEffectScore) {
    return (typeof effect.score != 'undefined') || (typeof effect.variable != 'undefined') ? true : false;
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

  static replaceValues(play: GamePlay, html: string): string {
    let t = html;
    // console.log('replaceValues-start', new Date());
    if (play && (play.score != undefined)) {
      t = t.replaceAll(`{{score}}`, ''+play.score).replaceAll(`__score__`, ''+play.score);
      // console.log('replaceValues-score', new Date());
    }
    if (play && play.clipboard) {
      let s = play.clipboard as any;
      Object.keys(s).forEach(k => t = t
        .replaceAll(`{{${k}}}`, s[k])
        .replaceAll(`__${k}__`, s[k])
      );
      // console.log('replaceValues-clipboard', new Date());
    }
    if (play && play.settings) {
      let s = play.settings as any;
      Object.keys(s).forEach(k => t = t
        .replaceAll(`{{${k}}}`, s[k])
        .replaceAll(`__${k}__`, s[k])
      );
      // console.log('replaceValues-settings', new Date());
    }
    if (play && play.variables) {
      let s = play.variables as any;
      Object.keys(s).forEach(k => t = t
        .replaceAll(`{{${k}}}`, s[k])
        .replaceAll(`__${k}__`, s[k])
      );
      // console.log('replaceValues-variables', new Date());
    }
    return t;
  }
  
  id: string;
  currentPage?: string;
  currentScanner?: string;
  nearest?: string;

  story: GamePlayStory[];
  badges: string[];
  options: string[];
  score: number;
  variables: {[code: string]: number|string};
  clipboard: {[code: string]: string};
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
    this.clipboard = {};
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
  menu?: string;
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
  template?: string;
  data?: {[id:string]: number|string};
}

export class GameQrScanner {
  id: string;
  url: string;
  template?: string;
  data?: {[id:string]: number|string};
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
  icon?: string | GameLayerIcon | [{condition: GameCondition, icon: string | GameLayerIcon}];
  pos?: number[];
  condition?: GameCondition;

  lat: number; // obsolete?
  lon: number; // obsolete?
  near: boolean;
  description: string;
  anchor: number[];

}

export class MapFeaturePolyline extends MapLocation{
  static isPolyline(f: MapFeaturePolyline): boolean {
    return f.polyline ? true: false;
  }
  polyline: (string | number[])[];
  style?: GeoJSONOptions;
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

