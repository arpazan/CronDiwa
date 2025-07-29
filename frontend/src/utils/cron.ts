import cronstrue from 'cronstrue';
export interface CronParts {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
    minuteCustom: string;
    hourCustom: string;
    dayOfMonthCustom: string;
    monthCustom: string;
    dayOfWeekCustom: string;
  }

  export interface CronTemplate {
    label: string;
    value: string;
  }
  
  // Cron validation regex - standard 5-part cron expression
  export const cronRegex = /^(((\*|\d+|\d+-\d+)(\/\d+)?)(,(\*|\d+|\d+-\d+)(\/\d+)?)*)(\s+(((\*|\d+|\d+-\d+)(\/\d+)?)(,(\*|\d+|\d+-\d+)(\/\d+)?)*)){4}$/;

  export const cronTemplates: CronTemplate[] = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every day at midnight', value: '0 0 * * *' },
    { label: 'Every day at noon', value: '0 12 * * *' },
    { label: 'Every Monday at 9am', value: '0 9 * * 1' },
    { label: 'Every weekday at 9am', value: '0 9 * * 1-5' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'First day of month at midnight', value: '0 0 1 * *' }
  ];

  export const getDefaultCronParts = (): CronParts => ({
    minute: '*',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
    minuteCustom: '',
    hourCustom: '',
    dayOfMonthCustom: '',
    monthCustom: '',
    dayOfWeekCustom: ''
  });

  export const validateCronExpression = (expression: string): { 
    isValid: boolean; 
    errorMessage: string; 
    description: string;
  } => {
    if (!expression) {
      return {
        isValid: false,
        errorMessage: 'Cron expression is required',
        description: ''
      };
    }
  
    if (!cronRegex.test(expression)) {
      return {
        isValid: false,
        errorMessage: 'Invalid cron expression format',
        description: ''
      };
    }
  
    try {
      const description = cronstrue.toString(expression);
      return {
        isValid: true,
        errorMessage: '',
        description
      };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: 'Invalid cron expression',
        description: ''
      };
    }
  };
  
  /**
   * Build a cron expression from parts
   * @param parts The cron parts to build from
   * @returns The built cron expression
   */
  export const buildCronExpression = (parts: CronParts): string => {
    const minute = parts.minute === 'custom' ? parts.minuteCustom : parts.minute;
    const hour = parts.hour === 'custom' ? parts.hourCustom : parts.hour;
    const dayOfMonth = parts.dayOfMonth === 'custom' ? parts.dayOfMonthCustom : parts.dayOfMonth;
    const month = parts.month === 'custom' ? parts.monthCustom : parts.month;
    const dayOfWeek = parts.dayOfWeek === 'custom' ? parts.dayOfWeekCustom : parts.dayOfWeek;
  
    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  };
  
  /**
   * Parse a cron expression into parts
   * @param expression The cron expression to parse
   * @returns The parsed cron parts, or null if invalid
   */
  export const parseCronExpression = (expression: string): CronParts | null => {
    if (!expression) return null;
    
    const parts = expression.split(' ');
    if (parts.length !== 5) return null;
    
    const cronParts = getDefaultCronParts();
    
    // Minutes
    if (['*', '*/5', '*/15', '*/30', '0'].includes(parts[0])) {
      cronParts.minute = parts[0];
    } else {
      cronParts.minute = 'custom';
      cronParts.minuteCustom = parts[0];
    }
    
    // Hours
    if (['*', '*/2', '*/6', '0', '12'].includes(parts[1])) {
      cronParts.hour = parts[1];
    } else {
      cronParts.hour = 'custom';
      cronParts.hourCustom = parts[1];
    }
    
    // Day of month
    if (['*', '1', '15', 'L'].includes(parts[2])) {
      cronParts.dayOfMonth = parts[2];
    } else {
      cronParts.dayOfMonth = 'custom';
      cronParts.dayOfMonthCustom = parts[2];
    }
    
    // Month
    if (['*', '1', '6', '12'].includes(parts[3])) {
      cronParts.month = parts[3];
    } else {
      cronParts.month = 'custom';
      cronParts.monthCustom = parts[3];
    }
    
    // Day of week
    if (['*', '0', '1', '5', '6', '1-5', '0,6'].includes(parts[4])) {
      cronParts.dayOfWeek = parts[4];
    } else {
      cronParts.dayOfWeek = 'custom';
      cronParts.dayOfWeekCustom = parts[4];
    }
    
    return cronParts;
  };