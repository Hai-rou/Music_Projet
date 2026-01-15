import { Routes } from '@angular/router';
import { LibraryComponent } from './features/library/library.component';
import { PlayerComponent } from './features/player/player.component';
import { PlaylistsComponent } from './features/playlists/playlists.component';
import { HomepageComponent } from './features/homepage/homepage.component';
import { AboutComponent } from './features/about/about.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'library', component: LibraryComponent },
  { path: 'player', component: PlayerComponent },
  { path: 'playlists', component: PlaylistsComponent },
  { path: 'about', component: AboutComponent}
];
