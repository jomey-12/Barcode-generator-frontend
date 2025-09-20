// save-template-dialog.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-save-template-dialog',
 templateUrl: './save-template-dialog.component.html',
  styleUrls: ['./save-template-dialog.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class SaveTemplateDialogComponent {
  @Input() name: string = '';
  @Output() nameChange = new EventEmitter<string>();
@Output() saveClicked = new EventEmitter<string>();

  @Output() cancel = new EventEmitter<void>();

 onSave() {
  this.saveClicked.emit(this.name);
}

  // called when input changes
  onNameChange(newName: string) {
    this.name = newName;
    this.nameChange.emit(newName);   // notify parent
  }
  
  close() {
    this.cancel.emit();
  }
}
