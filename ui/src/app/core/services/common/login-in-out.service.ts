import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { ActionCode } from '@config/actionCode';
import { TokenKey, TokenPre } from '@config/constant';
import { SimpleReuseStrategy } from '@core/services/common/reuse-strategy';
import { TabService } from '@core/services/common/tab.service';
import { WindowService } from '@core/services/common/window.service';
import { Menu } from '@core/services/types';
import { LoginService } from '@services/login/login.service';
import { MenuStoreService } from '@store/common-store/menu-store.service';
import { UserInfo, UserInfoStoreService } from '@store/common-store/userInfo-store.service';
import { fnFlatDataHasParentToTree } from '@utils/treeTableTools';

/*
 * 登录/登出
 * */
@Injectable({
  providedIn: 'root'
})
export class LoginInOutService {
  private destroyRef = inject(DestroyRef);
  private activatedRoute = inject(ActivatedRoute);
  private tabService = inject(TabService);
  private loginService = inject(LoginService);
  private router = inject(Router);
  private userInfoService = inject(UserInfoStoreService);
  private menuService = inject(MenuStoreService);
  private windowServe = inject(WindowService);

  getMenuByUserAuthCode(authCode: string[]): Observable<Menu[]> {
    return this.loginService.getMenuByUserAuthCode(authCode);
  }

  loginIn(token: string): Promise<void> {
    return new Promise(resolve => {
      this.windowServe.setSessionStorage(TokenKey, TokenPre + token);
      const userInfo: UserInfo = this.userInfoService.parsToken(TokenPre + token);
      this.userInfoService
        .getUserAuthCodeByUserId(userInfo.userId)
        .pipe(
          switchMap(autoCodeArray => {
            userInfo.authCode = autoCodeArray;
            userInfo.authCode.push(ActionCode.TabsDetail);
            userInfo.authCode.push(ActionCode.SearchTableDetail);
            this.userInfoService.setUserInfo(userInfo);
            return this.getMenuByUserAuthCode(userInfo.authCode);
          }),
          finalize(() => {
            resolve();
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(menus => {
          menus = menus.filter(item => {
            item.selected = false;
            item.open = false;
            return item.menuType === 'C';
          });
          const temp = fnFlatDataHasParentToTree(menus);
          this.menuService.setMenuArrayStore(temp);
          resolve();
        });
    });
  }

  clearTabCash(): Promise<void> {
    return SimpleReuseStrategy.deleteAllRouteSnapshot(this.activatedRoute.snapshot).then(() => {
      return new Promise(resolve => {
        this.tabService.clearTabs();
        resolve();
      });
    });
  }

  clearSessionCash(): Promise<void> {
    return new Promise(resolve => {
      this.windowServe.removeSessionStorage(TokenKey);
      this.menuService.setMenuArrayStore([]);
      resolve();
    });
  }

  loginOut(): Promise<void> {
    this.loginService.loginOut().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    return this.clearTabCash()
      .then(() => {
        return this.clearSessionCash();
      })
      .then(() => {
        this.router.navigate(['/login/login-form']);
      });
  }
}
