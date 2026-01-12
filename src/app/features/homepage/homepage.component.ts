import { Component } from "@angular/core";
import { LibraryComponent } from "../library/library.component";

@Component({
  selector: "app-homepage",
  standalone: true,
  imports: [LibraryComponent],
  templateUrl: "./homepage.component.html",
  styleUrls: ["./homepage.component.scss"],
})
export class HomepageComponent {}