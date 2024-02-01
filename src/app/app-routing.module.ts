import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLandingComponent } from './components/pages/main-landing/main-landing.component';
import { GameConfigComponent } from './components/pages/game-config/game-config.component';

const routes: Routes = [
  {path:'', component: MainLandingComponent},
  {path:'config', component: GameConfigComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
