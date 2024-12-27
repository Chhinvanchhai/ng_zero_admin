import { Component, OnInit, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { LoginInOutService } from '@core/services/common/login-in-out.service';
import { LoginService } from '@core/services/http/login/login.service';
import { SpinService } from '@store/common-store/spin.service';
import { fnCheckForm } from '@utils/tools';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzFormModule, ReactiveFormsModule, NzTabsModule, NzGridModule, NzButtonModule, NzInputModule, NzWaveModule, NzCheckboxModule, NzIconModule, RouterLink, NzNotificationModule]
})
export class LoginFormComponent implements OnInit {
  validateForm!: FormGroup;
  destroyRef = inject(DestroyRef);

  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);
  private router = inject(Router);
  private spinService = inject(SpinService);
  private dataService = inject(LoginService);
  private loginInOutService = inject(LoginInOutService);

  submitForm(): void {
    // Validate the form
    if (!fnCheckForm(this.validateForm)) {
      return;
    }
    // Set global loading
    this.spinService.setCurrentGlobalSpinStore(true);
    // Get form values
    const param = this.validateForm.getRawValue();
    // Call the login API
    // TODO: The login backend response follows a unified pattern. If the code is not 200,
    // it will automatically be intercepted. If you need to modify this behavior, update it
    // in src/app/core/services/http/base-http.service.ts.
    // Example response format:
    // {
    //   code: number,
    //   data: NzSafeAny,
    //   msg: string
    // }
    this.dataService
      .login(param)
      .pipe(
        // Always set global loading to false
        finalize(() => {
          this.spinService.setCurrentGlobalSpinStore(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(userToken => {
        // After successful login, the backend returns only a JWT-encrypted token.
        // The token needs to be decoded below.
        this.loginInOutService
          .loginIn(userToken)
          .then(() => {
            this.router.navigateByUrl('default/dashboard/analysis');
          })
          .finally(() => {
            this.spinService.setCurrentGlobalSpinStore(false);
            this.notification.blank(
              'Kind Reminder',
              `
                Source Code: <a href="https://github.com/huajian123/ng-antd-admin">Here</a>
              `,
              {
                nzPlacement: 'top',
                nzDuration: 0
              }
            );
          });
      });
  }

  ngOnInit(): void {
    // Clear all caches upon entering the login page
    this.loginInOutService.loginOut();
    this.validateForm = this.fb.group({
      userName: [null, [Validators.required]],
      password: [null, [Validators.required]],
      remember: [null]
    });
  }
}
