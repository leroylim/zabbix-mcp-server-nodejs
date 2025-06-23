/**
 * Zabbix API Type Definitions
 * Comprehensive types for all Zabbix API entities and operations
 */

// Base types
export type ZabbixId = string;
export type ZabbixTimestamp = string;
export type ZabbixStatus = '0' | '1';
export type ZabbixSeverity = '0' | '1' | '2' | '3' | '4' | '5';

// API Request/Response types
export interface ZabbixApiRequest<T = any> {
  jsonrpc: '2.0';
  method: string;
  params: T;
  id: string | number;
  auth?: string;
}

export interface ZabbixApiResponse<T = any> {
  jsonrpc: '2.0';
  result?: T;
  error?: ZabbixApiError;
  id: string | number;
}

export interface ZabbixApiError {
  code: number;
  message: string;
  data: string;
}

// Host related types
export interface ZabbixHost {
  hostid: ZabbixId;
  host: string;
  name: string;
  status: ZabbixStatus;
  description?: string;
  proxy_hostid?: ZabbixId;
  maintenance_status?: ZabbixStatus;
  maintenance_type?: ZabbixStatus;
  maintenance_from?: ZabbixTimestamp;
  interfaces?: HostInterface[];
  groups?: HostGroup[];
  templates?: Template[];
  items?: Item[];
  triggers?: Trigger[];
  macros?: HostMacro[];
}

export interface HostInterface {
  interfaceid: ZabbixId;
  hostid: ZabbixId;
  main: ZabbixStatus;
  type: '1' | '2' | '3' | '4'; // Agent, SNMP, IPMI, JMX
  useip: ZabbixStatus;
  ip: string;
  dns: string;
  port: string;
  details?: {
    version?: string;
    bulk?: ZabbixStatus;
    community?: string;
    securityname?: string;
    securitylevel?: string;
    authpassphrase?: string;
    privpassphrase?: string;
    authprotocol?: string;
    privprotocol?: string;
    contextname?: string;
  };
}

export interface HostGroup {
  groupid: ZabbixId;
  name: string;
  internal?: ZabbixStatus;
  hosts?: ZabbixHost[];
  templates?: Template[];
}

// Item related types
export interface Item {
  itemid: ZabbixId;
  hostid: ZabbixId;
  name: string;
  key_: string;
  type: string;
  value_type: '0' | '1' | '2' | '3' | '4'; // Float, Character, Log, Unsigned, Text
  status: ZabbixStatus;
  state: ZabbixStatus;
  delay: string;
  history: string;
  trends: string;
  units?: string;
  description?: string;
  lastvalue?: string;
  lastclock?: ZabbixTimestamp;
  prevvalue?: string;
  preprocessing?: ItemPreprocessing[];
  triggers?: Trigger[];
}

export interface ItemPreprocessing {
  type: string;
  params: string;
  error_handler: string;
  error_handler_params: string;
}

// Trigger related types
export interface Trigger {
  triggerid: ZabbixId;
  description: string;
  expression: string;
  status: ZabbixStatus;
  value: ZabbixStatus;
  priority: ZabbixSeverity;
  lastchange: ZabbixTimestamp;
  comments?: string;
  error?: string;
  templateid?: ZabbixId;
  type?: ZabbixStatus;
  state?: ZabbixStatus;
  flags?: string;
  recovery_mode?: string;
  recovery_expression?: string;
  correlation_mode?: string;
  correlation_tag?: string;
  manual_close?: ZabbixStatus;
  opdata?: string;
  hosts?: ZabbixHost[];
  items?: Item[];
  functions?: TriggerFunction[];
  dependencies?: TriggerDependency[];
  tags?: TriggerTag[];
}

export interface TriggerFunction {
  functionid: ZabbixId;
  itemid: ZabbixId;
  function: string;
  parameter: string;
}

export interface TriggerDependency {
  dependsOnTriggerid: ZabbixId;
}

export interface TriggerTag {
  tag: string;
  value: string;
}

// Problem related types
export interface Problem {
  eventid: ZabbixId;
  source: string;
  object: string;
  objectid: ZabbixId;
  clock: ZabbixTimestamp;
  ns: string;
  r_eventid?: ZabbixId;
  r_clock?: ZabbixTimestamp;
  r_ns?: string;
  correlationid?: ZabbixId;
  userid?: ZabbixId;
  name: string;
  acknowledged: ZabbixStatus;
  severity: ZabbixSeverity;
  hosts?: ZabbixHost[];
  acknowledges?: Acknowledge[];
  tags?: EventTag[];
  suppressed?: ZabbixStatus;
  suppression_data?: SuppressionData[];
}

export interface Acknowledge {
  acknowledgeid: ZabbixId;
  userid: ZabbixId;
  eventid: ZabbixId;
  clock: ZabbixTimestamp;
  message: string;
  action: string;
  old_severity?: ZabbixSeverity;
  new_severity?: ZabbixSeverity;
}

export interface EventTag {
  tag: string;
  value: string;
}

export interface SuppressionData {
  maintenanceid: ZabbixId;
  suppress_until: ZabbixTimestamp;
}

// Template related types
export interface Template {
  templateid: ZabbixId;
  host: string;
  name: string;
  description?: string;
  groups?: HostGroup[];
  hosts?: ZabbixHost[];
  items?: Item[];
  triggers?: Trigger[];
  macros?: HostMacro[];
  dashboards?: Dashboard[];
}

// User related types
export interface User {
  userid: ZabbixId;
  username: string;
  name?: string;
  surname?: string;
  url?: string;
  autologin: ZabbixStatus;
  autologout: string;
  lang: string;
  refresh: string;
  theme: string;
  attempt_failed: string;
  attempt_ip?: string;
  attempt_clock?: ZabbixTimestamp;
  rows_per_page: string;
  timezone: string;
  roleid: ZabbixId;
  usrgrps?: UserGroup[];
  medias?: Media[];
}

export interface UserGroup {
  usrgrpid: ZabbixId;
  name: string;
  gui_access: string;
  users_status: ZabbixStatus;
  debug_mode: ZabbixStatus;
  users?: User[];
  rights?: Right[];
  tag_filters?: TagFilter[];
}

export interface Media {
  mediaid: ZabbixId;
  userid: ZabbixId;
  mediatypeid: ZabbixId;
  sendto: string;
  active: ZabbixStatus;
  severity: string;
  period: string;
}

export interface Right {
  permission: string;
  id: ZabbixId;
}

export interface TagFilter {
  groupid: ZabbixId;
  tag: string;
  value: string;
}

// Maintenance related types
export interface Maintenance {
  maintenanceid: ZabbixId;
  name: string;
  maintenance_type: ZabbixStatus;
  description?: string;
  active_since: ZabbixTimestamp;
  active_till: ZabbixTimestamp;
  tags_evaltype?: string;
  hosts?: ZabbixHost[];
  groups?: HostGroup[];
  timeperiods?: MaintenanceTimeperiod[];
  tags?: MaintenanceTag[];
}

export interface MaintenanceTimeperiod {
  timeperiodid: ZabbixId;
  timeperiod_type: string;
  every: string;
  month: string;
  dayofweek: string;
  day: string;
  start_time: string;
  period: string;
  start_date?: ZabbixTimestamp;
}

export interface MaintenanceTag {
  tag: string;
  operator: string;
  value: string;
}

// History and trends
export interface HistoryItem {
  itemid: ZabbixId;
  clock: ZabbixTimestamp;
  value: string;
  ns?: string;
}

export interface TrendItem {
  itemid: ZabbixId;
  clock: ZabbixTimestamp;
  num: string;
  value_min: string;
  value_avg: string;
  value_max: string;
}

// Dashboard related types
export interface Dashboard {
  dashboardid: ZabbixId;
  name: string;
  userid?: ZabbixId;
  private: ZabbixStatus;
  display_period: string;
  auto_start: ZabbixStatus;
  pages?: DashboardPage[];
  users?: DashboardUser[];
  userGroups?: DashboardUserGroup[];
}

export interface DashboardPage {
  dashboard_pageid: ZabbixId;
  name?: string;
  display_period?: string;
  widgets?: Widget[];
}

export interface Widget {
  widgetid: ZabbixId;
  type: string;
  name?: string;
  x: string;
  y: string;
  width: string;
  height: string;
  view_mode: ZabbixStatus;
  fields?: WidgetField[];
}

export interface WidgetField {
  type: string;
  name: string;
  value: string;
}

export interface DashboardUser {
  userid: ZabbixId;
  permission: string;
}

export interface DashboardUserGroup {
  usrgrpid: ZabbixId;
  permission: string;
}

// Host macro types
export interface HostMacro {
  hostmacroid: ZabbixId;
  hostid: ZabbixId;
  macro: string;
  value: string;
  description?: string;
  type?: ZabbixStatus;
}

// API method parameter types
export interface HostGetParams {
  hostids?: ZabbixId[];
  groupids?: ZabbixId[];
  templateids?: ZabbixId[];
  proxyids?: ZabbixId[];
  interfaceids?: ZabbixId[];
  graphids?: ZabbixId[];
  triggerids?: ZabbixId[];
  maintenanceids?: ZabbixId[];
  monitored_hosts?: boolean;
  templated_hosts?: boolean;
  proxy_hosts?: boolean;
  with_items?: boolean;
  with_item_prototypes?: boolean;
  with_simple_graph_items?: boolean;
  with_simple_graph_item_prototypes?: boolean;
  with_graphs?: boolean;
  with_graph_prototypes?: boolean;
  with_httptests?: boolean;
  with_monitored_httptests?: boolean;
  with_monitored_items?: boolean;
  with_monitored_triggers?: boolean;
  with_triggers?: boolean;
  with_trigger_prototypes?: boolean;
  withProblemsSuppressed?: boolean;
  evaltype?: string;
  severities?: ZabbixSeverity[];
  tags?: EventTag[];
  inheritedTags?: boolean;
  selectGroups?: string | string[];
  selectHostGroups?: string | string[];
  selectTemplates?: string | string[];
  selectParentTemplates?: string | string[];
  selectItems?: string | string[];
  selectDiscoveries?: string | string[];
  selectTriggers?: string | string[];
  selectGraphs?: string | string[];
  selectApplications?: string | string[];
  selectDiscoveryRule?: string | string[];
  selectHostDiscovery?: string | string[];
  selectHttpTests?: string | string[];
  selectInterfaces?: string | string[];
  selectInventory?: string | string[];
  selectMacros?: string | string[];
  selectDashboards?: string | string[];
  selectTags?: string | string[];
  selectInheritedTags?: string | string[];
  selectValueMaps?: string | string[];
  filter?: Record<string, any>;
  search?: Record<string, any>;
  searchByAny?: boolean;
  startSearch?: boolean;
  excludeSearch?: boolean;
  searchWildcardsEnabled?: boolean;
  output?: string | string[];
  editable?: boolean;
  countOutput?: boolean;
  groupCount?: boolean;
  preservekeys?: boolean;
  sortfield?: string | string[];
  sortorder?: string | string[];
  limit?: number;
  limitSelects?: number;
}

export interface ItemGetParams {
  itemids?: ZabbixId[];
  hostids?: ZabbixId[];
  groupids?: ZabbixId[];
  templateids?: ZabbixId[];
  interfaceids?: ZabbixId[];
  graphids?: ZabbixId[];
  triggerids?: ZabbixId[];
  applicationids?: ZabbixId[];
  webitems?: boolean;
  inherited?: boolean;
  templated?: boolean;
  monitored?: boolean;
  group?: string;
  host?: string;
  application?: string;
  with_triggers?: boolean;
  selectHosts?: string | string[];
  selectInterfaces?: string | string[];
  selectTriggers?: string | string[];
  selectGraphs?: string | string[];
  selectApplications?: string | string[];
  selectDiscoveryRule?: string | string[];
  selectItemDiscovery?: string | string[];
  selectPreprocessing?: string | string[];
  selectTags?: string | string[];
  selectValueMap?: string | string[];
  filter?: Record<string, any>;
  search?: Record<string, any>;
  searchByAny?: boolean;
  startSearch?: boolean;
  excludeSearch?: boolean;
  searchWildcardsEnabled?: boolean;
  output?: string | string[];
  editable?: boolean;
  countOutput?: boolean;
  groupCount?: boolean;
  preservekeys?: boolean;
  sortfield?: string | string[];
  sortorder?: string | string[];
  limit?: number;
  limitSelects?: number;
} 