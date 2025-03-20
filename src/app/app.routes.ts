import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminChatComponent } from './admin/admin-chat.component';

export const routes: Routes = [
        { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'admin', component: AdminChatComponent },
 
];
