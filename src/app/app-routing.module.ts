import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLandingComponent } from './components/pages/main-landing/main-landing.component';
import { GameConfigComponent } from './components/pages/game-config/game-config.component';
import { PlayNewGameComponent } from './components/pages/play-new-game/play-new-game.component';

const routes: Routes = [
  {path:'', component: MainLandingComponent},
  {path:'config', component: GameConfigComponent},
  {path:'play/:b64url', component: PlayNewGameComponent},
  {path:'play/:b64url/:qr', component: PlayNewGameComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
