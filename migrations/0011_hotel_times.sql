-- Add optional check-in / check-out time to hotels
alter table hotels add column if not exists check_in_time text;
alter table hotels add column if not exists check_out_time text;
