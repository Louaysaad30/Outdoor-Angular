import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsService } from '../../services/statistics.service';
import { forkJoin } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    TabsModule,
    SharedModule,
    FormsModule,
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  totalUsers: number = 0;
  verifiedUsers: number = 0;
  nonVerifiedUsers: number = 0;
  blockedUsers: number = 0;
  nonBlockedUsers: number = 0;
  totalMessages: number = 0;
  unreadMessages: number = 0;
  usersByRole: Record<string, number> = {};
  messagesByUser: Record<number, number> = {};
  messagesByChatRoom: Record<number, number> = {};

  isLoading: boolean = true;
  error: string = '';

  // ApexCharts configuration
  usersByRoleChartData: any[] = [];
  usersByRoleChartLabels: string[] = [];
  messagesByUserChartData: any[] = [];
  messagesByUserChartLabels: string[] = [];
  messagesByChatRoomChartData: any[] = [];
  messagesByChatRoomChartLabels: string[] = [];
  churnData: any[] = [];
  churnLabels: string[] = ['Churned Users', 'Active Users'];

  constructor(private statisticsService: StatisticsService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading = true;
    this.error = '';
  
    forkJoin({
      total: this.statisticsService.getTotalUsers(),
      verified: this.statisticsService.getVerifiedUsers(),
      nonVerified: this.statisticsService.getNonVerifiedUsers(),
      blocked: this.statisticsService.getBlockedUsers(),
      nonBlocked: this.statisticsService.getNonBlockedUsers(),
      totalMsgs: this.statisticsService.getTotalMessages(),
      unreadMsgs: this.statisticsService.getUnreadMessages(),
      roles: this.statisticsService.getUsersByRole(),
      msgsByUser: this.statisticsService.getMessagesByUser(),
      msgsByChat: this.statisticsService.getMessagesByChatRoom(),
      churnStats: this.statisticsService.getChurnStatistics()
    }).subscribe({
      next: (res) => {
        // Destructuring the response data
        this.totalUsers = res.total.totalUsers;
        this.verifiedUsers = res.verified.verifiedUsers;
        this.nonVerifiedUsers = res.nonVerified.nonVerifiedUsers;
        this.blockedUsers = res.blocked.blockedUsers;
        this.nonBlockedUsers = res.nonBlocked.nonBlockedUsers;
        this.totalMessages = res.totalMsgs.totalMessages;
        this.unreadMessages = res.unreadMsgs.unreadMessages;
        this.usersByRole = res.roles.usersByRole || {};
        this.messagesByUser = res.msgsByUser.messagesByUser || {};
        this.messagesByChatRoom = res.msgsByChat.messagesByChatRoom || {};

        // Prepare chart data for "Users by Role"
        this.usersByRoleChartLabels = Object.keys(this.usersByRole);
        this.usersByRoleChartData = Object.values(this.usersByRole);
      
        this.churnData = [res.churnStats.churn, res.churnStats.notChurn];

  
        // Messages by User chart
        this.messagesByUserChartLabels = Object.keys(this.messagesByUser).map(userId => `User ${userId}`);
        this.messagesByUserChartData = [
          {
            name: 'Messages by User',
            data: Object.values(this.messagesByUser)
          }
        ];
  
        // Messages by Chat Room chart
        this.messagesByChatRoomChartLabels = Object.keys(this.messagesByChatRoom).map(roomId => `Room ${roomId}`);
        this.messagesByChatRoomChartData = [
          {
            name: 'Messages by Chat Room',
            data: Object.values(this.messagesByChatRoom)
          }
        ];
  
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        this.error = 'Failed to load statistics. Please try again.';
        this.isLoading = false;
      }
    });
  }
  isSendingEmails: boolean = false;
  emailSentMessage: string = '';

  sendChurnEmails(): void {
    this.isSendingEmails = true;
    this.emailSentMessage = '';
    
    this.statisticsService.sendChurnEmails().subscribe({
      next: (response: string) => {
        this.emailSentMessage = response;
        this.isSendingEmails = false;  // Set to false on success
      },
      error: (error) => {
        this.emailSentMessage = error || 'Failed to send emails';
        this.isSendingEmails = false;
      },
      complete: () => {
        this.isSendingEmails = false;
      }
    });
  }
  
}
