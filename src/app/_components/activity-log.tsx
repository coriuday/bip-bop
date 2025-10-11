import React from 'react';

interface Activity {
  id: string;
  action: string;
  date: string;
}

const mockActivities: Activity[] = [
  { id: '1', action: 'Uploaded a video', date: '2025-09-25' },
  { id: '2', action: 'Commented on a post', date: '2025-09-24' },
  { id: '3', action: 'Followed @user123', date: '2025-09-23' },
];

const ActivityLog: React.FC = () => (
  <div className="card bg-base-100 p-6 shadow mt-6">
    <h2 className="text-xl font-bold mb-4">Activity Log</h2>
    <ul className="timeline timeline-vertical">
      {mockActivities.map((activity) => (
        <li key={activity.id} className="timeline-item">
          <div className="timeline-start">{activity.date}</div>
          <div className="timeline-middle">
            <span className="dot bg-primary"></span>
          </div>
          <div className="timeline-end">{activity.action}</div>
        </li>
      ))}
    </ul>
  </div>
);

export default ActivityLog;

