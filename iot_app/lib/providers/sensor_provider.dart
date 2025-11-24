import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/sensor_data.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';

class SensorProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final WebSocketService _wsService = WebSocketService();
  
  SensorData _data = SensorData(
    mq2: 0,
    fire: 0,
    relay1: false,
    relay2: false,
    window: false,
    mode: 'AUTO',
    threshold: 4000,
    lastUpdate: DateTime.now(),
    connected: false,
  );
  
  List<dynamic> _notifications = [];
  List<double> _mq2History = [];
  final Map<String, bool> _loading = {};
  
  SensorData get data => _data;
  List<dynamic> get notifications => _notifications;
  List<double> get mq2History => _mq2History;
  
  bool isLoading(String key) => _loading[key] ?? false;

  SensorProvider() {
    _init();
  }

  void _init() async {
    // Initial fetch
    try {
      final initialData = await _apiService.getData();
      if (initialData['success'] == true) {
        _updateData(initialData['data']);
      }
      
      _notifications = await _apiService.getNotifications();
      notifyListeners();
    } catch (e) {
      print('Error fetching initial data: $e');
    }

    // Connect WebSocket
    _connectWebSocket();
  }

  void _connectWebSocket() {
    _wsService.connect().listen(
      (message) {
        try {
          final decoded = json.decode(message);
          if (decoded['type'] == 'data') {
            _updateData(decoded['data']);
          } else if (decoded['type'] == 'notification') {
            _notifications.insert(0, decoded['data']);
            if (_notifications.length > 50) _notifications.removeLast();
            notifyListeners();
          } else if (decoded['type'] == 'notifications') {
             final List<dynamic> newNotifs = decoded['data'];
             _notifications = newNotifs;
             notifyListeners();
          }
        } catch (e) {
          print('Error parsing WS message: $e');
        }
      },
      onError: (error) {
        print('WebSocket error: $error');
        _data = _data.copyWith(connected: false);
        notifyListeners();
        // Reconnect logic
        Future.delayed(Duration(seconds: 3), _connectWebSocket);
      },
      onDone: () {
        print('WebSocket closed');
        _data = _data.copyWith(connected: false);
        notifyListeners();
        Future.delayed(Duration(seconds: 3), _connectWebSocket);
      },
    );
  }

  void _updateData(Map<String, dynamic> rawData) {
    _data = SensorData.fromJson(rawData);
    _data = _data.copyWith(connected: true);
    
    // Update history for chart
    _mq2History.add(_data.mq2.toDouble());
    if (_mq2History.length > 30) {
      _mq2History.removeAt(0);
    }
    
    notifyListeners();
  }

  // Control methods
  Future<void> toggleRelay1() async {
    _loading['relay1'] = true;
    notifyListeners();
    try {
      await _apiService.controlRelay1(!_data.relay1);
    } finally {
      _loading['relay1'] = false;
      notifyListeners();
    }
  }

  Future<void> toggleRelay2() async {
    _loading['relay2'] = true;
    notifyListeners();
    try {
      await _apiService.controlRelay2(!_data.relay2);
    } finally {
      _loading['relay2'] = false;
      notifyListeners();
    }
  }

  Future<void> toggleWindow() async {
    _loading['window'] = true;
    notifyListeners();
    try {
      await _apiService.controlWindow(!_data.window);
    } finally {
      _loading['window'] = false;
      notifyListeners();
    }
  }

  Future<void> toggleMode() async {
    _loading['mode'] = true;
    notifyListeners();
    try {
      final newMode = _data.mode == 'AUTO' ? 'MANUAL' : 'AUTO';
      await _apiService.setMode(newMode);
    } finally {
      _loading['mode'] = false;
      notifyListeners();
    }
  }

  Future<void> setThreshold(int value) async {
    _loading['threshold'] = true;
    notifyListeners();
    
    try {
      await _apiService.setThreshold(value);
    } catch (e) {
      print('Error setting threshold: $e');
    } finally {
      _loading['threshold'] = false;
      notifyListeners();
    }
  }
}
