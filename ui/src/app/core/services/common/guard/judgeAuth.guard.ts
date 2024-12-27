import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, CanActivateChildFn } from '@angular/router';
import { Observable } from 'rxjs';

import { LoginInOutService } from '@core/services/common/login-in-out.service';
import { MenuStoreService } from '@store/common-store/menu-store.service';
import { UserInfoStoreService } from '@store/common-store/userInfo-store.service';
import { fnGetUUID } from '@utils/tools';
import { NzMessageService } from 'ng-zorro-antd/message';

import { Menu } from '../../types';

// For those interested, you can check the debate on `class` vs `fn` here: https://github.com/angular/angular/pull/47924
// In this example, I provide a different implementation compared to `judgeLogin.guard.ts` as a reference.
// You can also look up the `mapToCanActivate` API in the official documentation.
// This guard is used to determine whether a user has permission to access a specific business page when switching routes.
// If the user lacks permission, they are redirected to the login page.
@Injectable({
  providedIn: 'root'
})
export class JudgeAuthGuardService {
  authCodeArray: string[] = [];
  selMenu: Menu | null = null;
  menuNavList: Menu[] = [];
  destroyRef = inject(DestroyRef);
  loginOutService = inject(LoginInOutService);
  router = inject(Router);
  userInfoService = inject(UserInfoStoreService);
  menuStoreService = inject(MenuStoreService);
  message = inject(NzMessageService);

  constructor() {
    this.menuStoreService
      .getMenuArrayStore()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.menuNavList = res;
      });
  }

  // Save the current menu to `this.selMenu`
  getMenu(menu: Menu[], url: string): void {
    for (let i = 0; i < menu.length; i++) {
      if (url === menu[i].path) {
        this.selMenu = menu[i];
        return;
      } else {
        if (menu[i].children && menu[i].children!.length > 0) {
          this.getMenu(menu[i].children!, url);
        }
      }
    }
  }

  getResult(code: string, authCodeArray: string[]): boolean | UrlTree {
    if (authCodeArray.includes(code)) {
      return true;
    } else {
      this.message.error('You do not have permission to access this module');
      this.loginOutService.loginOut();
      return this.router.parseUrl('/login');
    }
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    this.userInfoService
      .getUserInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => (this.authCodeArray = res.authCode));
    while (route.firstChild) {
      route = route.firstChild;
    }
    // If there is an authCode, it means the navigation is triggered by a button click on the page, not by a menu route.
    if (!!route.data['authCode']) {
      return this.getResult(route.data['authCode'], this.authCodeArray);
    }

    // If it's a menu button, process below
    this.getMenu(this.menuNavList, state.url);
    // If no menu is found, redirect to the login page
    if (!this.selMenu) {
      return this.getResult(fnGetUUID(), this.authCodeArray);
    }
    const selMenuCode = this.selMenu.code;
    this.selMenu = null;
    // If a menu is found but the user does not have permission for it, redirect to the login page
    return this.getResult(selMenuCode!, this.authCodeArray);
  }
}

export const JudgeAuthGuard: CanActivateChildFn = (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  return inject(JudgeAuthGuardService).canActivateChild(childRoute, state);
};
