import React from 'react';
import { MoveUp, MoveDown } from 'lucide-react';

const KPICard = ({ title, value, change, icon: Icon, trend }) => {
    const isPositive = trend === 'up';

    return (
        <div className="card p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{title}</p>
                    <h3 className="text-2xl font-bold">{value}</h3>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <span className={`flex items-center gap-1 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                    style={{ color: isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
                    {isPositive ? <MoveUp size={14} /> : <MoveDown size={14} />}
                    {change}
                </span>
                <span className="text-muted-foreground" style={{ color: 'hsl(var(--muted-foreground))' }}>vs last month</span>
            </div>
        </div>
    );
};

export default KPICard;
