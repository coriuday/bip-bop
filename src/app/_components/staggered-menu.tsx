import React from 'react';

const menuItems = [
	{ label: 'Privacy / Protection', href: '/settings#privacy' },
	{ label: 'Profile Settings', href: '/settings#profile' },
	{ label: 'Activity Log', href: '/settings#activity' },
];

const StaggeredMenu: React.FC = () => (
	<ul className="menu bg-base-100 rounded-box shadow w-56">
		{menuItems.map((item, idx) => (
			<li
				key={item.href}
				style={{ transitionDelay: `${idx * 80}ms` }}
				className="transition-all duration-300 opacity-100 translate-x-0 hover:translate-x-2"
			>
				<a href={item.href}>{item.label}</a>
			</li>
		))}
	</ul>
);

export default StaggeredMenu;
