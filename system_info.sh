#!/bin/bash

# system_info.sh - 시스템 상태 출력 스크립트

echo "System information as of $(date)"
echo ""

load=$(uptime | awk -F'load average:' '{print $2}' | cut -d',' -f1)
processes=$(ps aux | wc -l)
disk=$(df -h / | awk 'NR==2 {print $5 " of " $2}')
users=$(who | wc -l)
memory=$(free -h | awk 'NR==2 {print $3 " / " $2}')
ip=$(hostname -I | awk '{print $1}')
swap=$(free -h | awk 'NR==3 {print $3 " / " $2}')

echo "System load: $load    Processes: $processes"
echo "Usage of /: $disk   Users logged in: $users"
echo "Memory usage: $memory   IPv4 address for ens4: $ip"
echo "Swap usage: $swap" 