// Exemple de composant UI partagé
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [],
  template: `
    <button [type]="type" [disabled]="disabled" class="btn">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: #1db954;
      color: white;
      font-weight: 600;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
}
