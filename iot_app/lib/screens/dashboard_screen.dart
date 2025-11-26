import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../providers/sensor_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/professional_widgets.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.modernGradient,
        ),
        child: SafeArea(
          child: Consumer<SensorProvider>(
            builder: (context, provider, child) {
              return RefreshIndicator(
                onRefresh: () async {
                  // Re-init provider data
                  // In a real app we might expose a refresh method
                },
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(AppTheme.spaceMedium),
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildHeader(provider),
                      const SizedBox(height: AppTheme.spaceLarge),
                      _buildSensorPanel(context, provider),
                      const SizedBox(height: AppTheme.spaceLarge),
                      _buildControlPanel(context, provider),
                      const SizedBox(height: AppTheme.spaceLarge),
                      // Wrap chart in RepaintBoundary at higher level
                      RepaintBoundary(
                        child: _buildChartPanel(context, provider),
                      ),
                      const SizedBox(height: AppTheme.spaceLarge),
                      _buildStatsPanel(context, provider),
                      const SizedBox(height: AppTheme.spaceLarge),
                      _buildNotificationsPanel(context, provider),
                      const SizedBox(height: AppTheme.spaceLarge),
                      _buildFooter(provider),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(SensorProvider provider) {
    return SectionHeader(
      title: '🔥 Gas Detection System',
      icon: Icons.whatshot,
      trailing: StatusBadge(
        label: provider.data.connected ? 'Đã kết nối' : 'Mất kết nối',
        color: provider.data.connected ? AppTheme.successGreen : AppTheme.dangerRed,
        icon: provider.data.connected ? Icons.check_circle : Icons.error,
      ),
    );
  }

  Widget _buildSensorPanel(BuildContext context, SensorProvider provider) {
    return Column(
      children: [
        MetricCard(
          title: 'Nồng độ Gas (MQ2)',
          value: '${provider.data.mq2}',
          unit: 'ppm',
          subtitle: _getGasStatus(provider.data.mq2, provider.data.threshold),
          icon: Icons.cloud,
          color: _getGasColor(provider.data.mq2, provider.data.threshold),
        ),
        const SizedBox(height: AppTheme.spaceMedium),
        MetricCard(
          title: 'Cảm biến lửa',
          value: provider.data.fire == 0 ? 'PHÁT HIỆN LỬA!' : 'Bình thường',
          subtitle: provider.data.fire == 0 ? 'NGUY HIỂM!' : 'An toàn',
          icon: Icons.local_fire_department,
          color: provider.data.fire == 0 ? AppTheme.dangerRed : AppTheme.successGreen,
        ),
        const SizedBox(height: AppTheme.spaceMedium),
        _buildThresholdCard(context, provider),
      ],
    );
  }

  Widget _buildSensorCard({
    required String title,
    required String icon,
    required String value,
    required String unit,
    required String status,
    required Color statusColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceLarge),
      decoration: AppTheme.cardDecoration().copyWith(
        border: Border(left: BorderSide(color: statusColor, width: 4)),
      ),
      child: Column(
        children: [
          Text(icon, style: const TextStyle(fontSize: 40)),
          const SizedBox(height: AppTheme.spaceMedium),
          Text(
            title,
            style: AppTheme.labelMedium.copyWith(
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: AppTheme.spaceMedium),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: statusColor,
                ),
              ),
              if (unit.isNotEmpty) ...[
                const SizedBox(width: 4),
                Text(
                  unit,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: statusColor),
            ),
            child: Text(
              status,
              style: TextStyle(
                color: statusColor,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThresholdCard(BuildContext context, SensorProvider provider) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text('⚠️', style: TextStyle(fontSize: 40)),
          const SizedBox(height: 10),
          const Text(
            'Ngưỡng cảnh báo',
            style: TextStyle(
              color: Color(0xFF64748B),
              fontWeight: FontWeight.w600,
              fontSize: 14,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '${provider.data.threshold}',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFF59E0B),
                ),
              ),
              const SizedBox(width: 4),
              const Text(
                'ppm',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Consumer<SensorProvider>(
            builder: (context, provider, _) {
              return Column(
                children: [
                   Slider(
                    value: provider.data.threshold.toDouble().clamp(200, 9999),
                    min: 200,
                    max: 9999,
                    divisions: 196,
                    activeColor: const Color(0xFFF59E0B),
                    onChanged: (value) {
                       
                    },
                    onChangeEnd: (value) {
                      provider.setThreshold(value.toInt());
                    },
                  ),
                  if (provider.isLoading('threshold'))
                    const Padding(
                      padding: EdgeInsets.only(top: 8.0),
                      child: LinearProgressIndicator(
                        color: Color(0xFFF59E0B),
                        backgroundColor: Color(0xFFFEF3C7),
                      ),
                    ),
                ],
              );
            }
          ),
          ElevatedButton(
            onPressed: () {
              _showThresholdDialog(context, provider);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFF59E0B),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('CÀI ĐẶT NGƯỠNG'),
          ),
        ],
      ),
    );
  }

  void _showThresholdDialog(BuildContext context, SensorProvider provider) {
    final controller = TextEditingController(text: provider.data.threshold.toString());
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Đặt ngưỡng cảnh báo'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Giá trị (200 - 9999)',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              final val = int.tryParse(controller.text);
              if (val != null && val >= 200 && val <= 9999) {
                provider.setThreshold(val);
                Navigator.pop(context);
              }
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  Widget _buildControlPanel(BuildContext context, SensorProvider provider) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceMedium),
      decoration: AppTheme.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(
            title: 'Bảng điều khiển',
            icon: Icons.tune,
          ),
          const SizedBox(height: AppTheme.spaceMedium),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Chế độ hoạt động:',
                style: AppTheme.headingSmall,
              ),
              GestureDetector(
                onTap: provider.isLoading('mode') ? null : () => provider.toggleMode(),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: provider.data.mode == 'AUTO'
                        ? AppTheme.successGradient
                        : AppTheme.warningGradient,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      BoxShadow(
                        color: (provider.data.mode == 'AUTO'
                                ? AppTheme.successGreen
                                : AppTheme.warningOrange)
                            .withOpacity(0.4),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: provider.isLoading('mode')
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          provider.data.mode,
                          style: AppTheme.labelMedium.copyWith(color: Colors.white),
                        ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spaceMedium),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: AppTheme.spaceSmall,
            crossAxisSpacing: AppTheme.spaceSmall,
            childAspectRatio: 1.1, // Adjusted for ControlCard
            children: [
              ControlCard(
                title: 'Relay 1',
                value: provider.data.relay1,
                icon: Icons.power,
                activeColor: AppTheme.successGreen,
                onTap: provider.isLoading('relay1') ? null : provider.toggleRelay1,
                isLoading: provider.isLoading('relay1'),
              ),
              ControlCard(
                title: 'Relay 2',
                value: provider.data.relay2,
                icon: Icons.power,
                activeColor: AppTheme.successGreen,
                onTap: provider.isLoading('relay2') ? null : provider.toggleRelay2,
                isLoading: provider.isLoading('relay2'),
              ),
              ControlCard(
                title: 'Cửa sổ',
                value: provider.data.window,
                icon: Icons.window,
                activeColor: AppTheme.successGreen,
                onTap: provider.isLoading('window') ? null : provider.toggleWindow,
                isLoading: provider.isLoading('window'),
                onLabel: 'MỞ',
                offLabel: 'ĐÓNG',
              ),
              ControlCard(
                title: 'Còi báo',
                value: provider.data.buzzer,
                icon: Icons.notifications_active,
                activeColor: AppTheme.successGreen,
                onTap: provider.isLoading('buzzer') ? null : provider.toggleBuzzer,
                isLoading: provider.isLoading('buzzer'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildControlBtn(
    String label,
    String icon,
    bool state,
    VoidCallback onTap, {
    String onLabel = 'ON',
    String offLabel = 'OFF',
    bool isLoading = false,
  }) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white.withOpacity(0.9),
              Colors.white.withOpacity(0.7),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(icon, style: const TextStyle(fontSize: 22)),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1E293B),
                      fontSize: 14,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                gradient: state
                    ? const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF34D399)])
                    : const LinearGradient(colors: [Color(0xFFEF4444), Color(0xFFF87171)]),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: (state ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                        .withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: isLoading
                  ? const Center(
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                    )
                  : Text(
                      state ? onLabel : offLabel,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        letterSpacing: 0.5,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChartPanel(BuildContext context, SensorProvider provider) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: const [
              Text('📊', style: TextStyle(fontSize: 24)),
              SizedBox(width: 10),
              Text(
                'Biểu đồ MQ2',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: 180,
                minY: 0,
                maxY: 10000,
                lineBarsData: [
                  LineChartBarData(
                    spots: provider.mq2History
                        .asMap()
                        .entries
                        .map((e) => FlSpot(e.key.toDouble(), e.value))
                        .toList(),
                    isCurved: true,
                    color: const Color(0xFF10B981),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFF10B981).withOpacity(0.1),
                    ),
                  ),
                  LineChartBarData(
                    spots: provider.thresholdHistory
                        .asMap()
                        .entries
                        .map((e) => FlSpot(e.key.toDouble(), e.value.toDouble()))
                        .toList(),
                    isCurved: false,
                    color: const Color(0xFFF97316),
                    barWidth: 2,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: false),
                    dashArray: [5, 5],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsPanel(BuildContext context, SensorProvider provider) {
    if (provider.mq2History.isEmpty) return const SizedBox.shrink();

    // Cache calculations to avoid recomputing on every rebuild
    final history = provider.mq2History;
    final sum = history.reduce((a, b) => a + b);
    final avg = (sum / history.length).round();
    final max = history.reduce((a, b) => a > b ? a : b).round();
    final min = history.reduce((a, b) => a < b ? a : b).round();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: const [
              Text('📈', style: TextStyle(fontSize: 24)),
              SizedBox(width: 10),
              Text(
                'Thống kê',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem('Trung bình', '$avg', 'ppm'),
              _buildStatItem('Cao nhất', '$max', 'ppm'),
              _buildStatItem('Thấp nhất', '$min', 'ppm'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, String unit) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        Text(
          unit,
          style: const TextStyle(
            fontSize: 10,
            color: Color(0xFF94A3B8),
          ),
        ),
      ],
    );
  }

  Widget _buildNotificationsPanel(BuildContext context, SensorProvider provider) {
    // Limit to 3 most recent notifications to prevent overload
    final maxNotifications = 15;
    final displayNotifications = provider.notifications.length > maxNotifications
        ? provider.notifications.take(maxNotifications).toList()
        : provider.notifications;

    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceMedium),
      decoration: AppTheme.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(
            title: 'Thông báo',
            icon: Icons.notifications,
            trailing: provider.notifications.length > maxNotifications
                ? StatusBadge(
                    label: '+${provider.notifications.length - maxNotifications} khác',
                    color: AppTheme.infoBlue,
                  )
                : null,
          ),
          const SizedBox(height: AppTheme.spaceMedium),
          if (displayNotifications.isEmpty)
            const EmptyState(message: 'Chưa có thông báo nào')
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: displayNotifications.length,
              separatorBuilder: (context, index) => const SizedBox(height: AppTheme.spaceSmall),
              itemBuilder: (context, index) {
                final notif = displayNotifications[index];
                final type = notif['type'] ?? 'info';
                final message = notif['message'] ?? '';
                final time = notif['receivedAt'] ?? notif['timestamp'];

                Color color = AppTheme.infoBlue;
                if (type == 'danger') color = AppTheme.dangerRed;
                if (type == 'warning') color = AppTheme.warningOrange;

                return Container(
                  padding: const EdgeInsets.all(AppTheme.spaceMedium),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceLight,
                    borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                    border: Border(left: BorderSide(color: color, width: 4)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 5,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          message,
                          style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ),
                      if (time != null)
                        Text(
                          _formatTime(time),
                          style: AppTheme.bodySmall.copyWith(color: AppTheme.textTertiary),
                        ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildFooter(SensorProvider provider) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Center(
        child: Text(
          'Last update: ${_formatTime(provider.data.lastUpdate)}',
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  String _getGasStatus(int value, int threshold) {
    if (value > threshold) return 'NGUY HIỂM!';
    if (value > threshold * 0.8) return 'Cảnh báo';
    return 'Bình thường';
  }

  Color _getGasColor(int value, int threshold) {
    if (value > threshold) return const Color(0xFFEF4444);
    if (value > threshold * 0.8) return const Color(0xFFF59E0B);
    return const Color(0xFF10B981);
  }

  String _formatTime(dynamic time) {
    try {
      if (time is String) {
        return DateFormat('HH:mm:ss').format(DateTime.parse(time));
      } else if (time is DateTime) {
        return DateFormat('HH:mm:ss').format(time);
      }
      return '';
    } catch (e) {
      return '';
    }
  }
}
