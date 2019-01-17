import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalSettings, LanguageCode } from 'shared/generated-types';
import { CustomFieldConfig } from 'shared/shared-types';

import { BaseDetailComponent } from '../../../common/base-detail.component';
import { _ } from '../../../core/providers/i18n/mark-for-extraction';
import { NotificationService } from '../../../core/providers/notification/notification.service';
import { DataService } from '../../../data/providers/data.service';
import { ServerConfigService } from '../../../data/server-config';

@Component({
    selector: 'vdr-global-settings',
    templateUrl: './global-settings.component.html',
    styleUrls: ['./global-settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSettingsComponent extends BaseDetailComponent<GlobalSettings> implements OnInit {
    detailForm: FormGroup;
    customFields: CustomFieldConfig[];
    languageCodes = Object.values(LanguageCode);

    constructor(
        router: Router,
        route: ActivatedRoute,
        serverConfigService: ServerConfigService,
        private changeDetector: ChangeDetectorRef,
        private dataService: DataService,
        private formBuilder: FormBuilder,
        private notificationService: NotificationService,
    ) {
        super(route, router, serverConfigService);
        this.customFields = this.getCustomFieldConfig('GlobalSettings');
        this.detailForm = this.formBuilder.group({
            availableLanguages: [''],
            customFields: this.formBuilder.group(
                this.customFields.reduce((hash, field) => ({ ...hash, [field.name]: '' }), {}),
            ),
        });
    }

    ngOnInit(): void {
        this.init();
    }

    customFieldIsSet(name: string): boolean {
        return !!this.detailForm.get(['customFields', name]);
    }

    save() {
        if (!this.detailForm.dirty) {
            return;
        }

        this.dataService.settings.updateGlobalSettings(this.detailForm.value).subscribe(
            () => {
                this.detailForm.markAsPristine();
                this.changeDetector.markForCheck();
                this.notificationService.success(_('common.notify-update-success'), { entity: 'Settings' });
            },
            err => {
                this.notificationService.error(_('common.notify-update-error'), {
                    entity: 'Settings',
                });
            },
        );
    }

    protected setFormValues(entity: GlobalSettings, languageCode: LanguageCode): void {
        this.detailForm.patchValue({
            availableLanguages: entity.availableLanguages,
        });
        if (this.customFields.length) {
            const customFieldsGroup = this.detailForm.get('customFields') as FormGroup;

            for (const fieldDef of this.customFields) {
                const key = fieldDef.name;
                const value = (entity as any).customFields[key];
                const control = customFieldsGroup.get(key);
                if (control) {
                    control.patchValue(value);
                }
            }
        }
    }
}