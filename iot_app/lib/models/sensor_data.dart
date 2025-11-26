class SensorData {
  final int mq2;
  final int fire;
  final bool relay1;
  final bool relay2;
  final bool window;
  final bool buzzer;
  final String mode;
  final int threshold;
  final DateTime lastUpdate;
  final bool connected;

  SensorData({
    required this.mq2,
    required this.fire,
    required this.relay1,
    required this.relay2,
    required this.window,
    required this.buzzer,
    required this.mode,
    required this.threshold,
    required this.lastUpdate,
    required this.connected,
  });

  factory SensorData.fromJson(Map<String, dynamic> json) {
    return SensorData(
      mq2: json['mq2'] ?? 0,
      fire: json['fire'] ?? 0,
      relay1: json['relay1'] ?? false,
      relay2: json['relay2'] ?? false,
      window: json['window'] ?? false,
      buzzer: json['buzzer'] ?? false,
      mode: json['mode'] ?? 'AUTO',
      threshold: json['threshold'] ?? 4000,
      lastUpdate: json['lastUpdate'] != null
          ? DateTime.parse(json['lastUpdate'])
          : DateTime.now(),
      connected: json['connected'] ?? false,
    );
  }
  
  SensorData copyWith({
    int? mq2,
    int? fire,
    bool? relay1,
    bool? relay2,
    bool? window,
    bool? buzzer,
    String? mode,
    int? threshold,
    DateTime? lastUpdate,
    bool? connected,
  }) {
    return SensorData(
      mq2: mq2 ?? this.mq2,
      fire: fire ?? this.fire,
      relay1: relay1 ?? this.relay1,
      relay2: relay2 ?? this.relay2,
      window: window ?? this.window,
      buzzer: buzzer ?? this.buzzer,
      mode: mode ?? this.mode,
      threshold: threshold ?? this.threshold,
      lastUpdate: lastUpdate ?? this.lastUpdate,
      connected: connected ?? this.connected,
    );
  }
}
