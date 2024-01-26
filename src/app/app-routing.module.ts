import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLandingComponent } from './components/pages/main-landing/main-landing.component';

const routes: Routes = [
  {path:'', component: MainLandingComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
