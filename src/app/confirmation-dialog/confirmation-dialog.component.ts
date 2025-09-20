import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss'],
    imports: [CommonModule],
})
export class ConfirmationDialogComponent {
    @Output() deleteClicked = new EventEmitter<void>();

    @Output() cancel = new EventEmitter<void>();

    onDelete() {
        this.deleteClicked.emit();
    }

    close() {
        this.cancel.emit();
    }
}
