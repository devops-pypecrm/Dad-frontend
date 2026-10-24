import { Button } from '@/components/ui/button';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
 ChevronDown,
 Mail,
 UserPlus,
 Trash2,
 Download,
 Tag,
 Phone,
 Calendar,
 Archive,
 X,
 Layers
} from 'lucide-react';

interface BulkActionsToolbarProps {
 selectedItems: string[];
 entityType: 'leads' | 'contacts' | 'accounts' | 'opportunities' | 'tasks';
 onClearSelection: () => void;
 onBulkAction: (action: string, data?: Record<string, unknown>) => void | Promise<void>;
 className?: string;
}

export function BulkActionsToolbar({
 selectedItems,
 entityType,
 onClearSelection,
 onBulkAction,
 className = ''
}: BulkActionsToolbarProps) {
 if (selectedItems.length === 0) return null;

 const getEntityActions = () => {
  const commonActions = [
   {
    label: 'Export Selected',
    icon: Download,
    action: 'export',
   },
   {
    label: 'Add Tags',
    icon: Tag,
    action: 'add-tags',
   }
  ];

  const entitySpecificActions: Record<string, { label: string; icon: typeof Tag; action: string }[]> = {
   leads: [
    { label: 'Update Status', icon: Tag, action: 'update-status' },
    { label: 'Assign to User', icon: UserPlus, action: 'assign' },
    { label: 'Send Email', icon: Mail, action: 'send-email' },
    { label: 'Schedule Follow-up', icon: Calendar, action: 'schedule-followup' },
    { label: 'Convert to Contacts', icon: UserPlus, action: 'convert' },
   ],
   contacts: [
    { label: 'Send Email', icon: Mail, action: 'send-email' },
    { label: 'Schedule Call', icon: Phone, action: 'schedule-call' },
    { label: 'Add to Campaign', icon: Mail, action: 'add-to-campaign' },
   ],
   accounts: [
    { label: 'Assign Owner', icon: UserPlus, action: 'assign-owner' },
    { label: 'Update Status', icon: Tag, action: 'update-status' },
    { label: 'Archive', icon: Archive, action: 'archive' },
   ],
   opportunities: [
    { label: 'Update Stage', icon: Tag, action: 'update-stage' },
    { label: 'Assign Owner', icon: UserPlus, action: 'assign-owner' },
    { label: 'Generate Quotes', icon: Download, action: 'generate-quotes' },
   ],
   tasks: [
    { label: 'Mark Complete', icon: Tag, action: 'mark-complete' },
    { label: 'Reassign', icon: UserPlus, action: 'reassign' },
    { label: 'Update Priority', icon: Tag, action: 'update-priority' },
   ]
  };

  return [...(entitySpecificActions[entityType] || []), ...commonActions];
 };

 const actions = getEntityActions();

 return (
  <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-[14px] border border-primary/20 bg-primary/5 p-3 gap-3 shadow-xs font-poppins mb-4 ${className}`}>
   <div className="flex items-center justify-between w-full sm:w-auto gap-3">
    <div className="flex items-center gap-2">
     <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Layers className="h-4 w-4" />
     </div>
     <span className="text-sm font-semibold text-foreground whitespace-nowrap">
      {selectedItems.length} {entityType} selected
     </span>
    </div>
    <Button
     variant="ghost"
     size="sm"
     onClick={onClearSelection}
     className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 px-2 text-xs rounded-[8px] gap-1"
    >
     <X className="h-3.5 w-3.5" />
     Clear
    </Button>
   </div>

   <div className="flex items-center gap-2 w-full sm:w-auto">
    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button
       variant="default"
       size="sm"
       className="bg-primary hover:bg-primary/90 w-full sm:w-auto h-9 rounded-[10px] text-xs gap-1.5"
      >
       Bulk Actions
       <ChevronDown className="h-3.5 w-3.5" />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end" collisionPadding={16} className="w-56 rounded-[10px]">
      {actions.map((action) => {
       const Icon = action.icon;
       return (
        <DropdownMenuItem
         key={action.action}
         onSelect={() => {
          onBulkAction(action.action);
         }}
         className="flex items-center gap-2 cursor-pointer rounded-[8px] text-sm"
        >
         <Icon className="h-3.5 w-3.5 text-muted-foreground" />
         {action.label}
        </DropdownMenuItem>
       );
      })}
      <DropdownMenuSeparator />
      <DropdownMenuItem
       onSelect={() => {
        onBulkAction('delete');
       }}
       className="flex items-center gap-2 cursor-pointer rounded-[8px] text-sm text-destructive focus:text-destructive focus:bg-destructive/10"
      >
       <Trash2 className="h-3.5 w-3.5" />
       Delete Selected
      </DropdownMenuItem>
     </DropdownMenuContent>
    </DropdownMenu>
   </div>
  </div>
 );
}