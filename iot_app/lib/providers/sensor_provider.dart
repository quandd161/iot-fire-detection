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
    buzzer: false,
    mode: 'AUTO',
    threshold: 4000,
    lastUpdate: DateTime.now(),
    connected: false,
  );
  
  List<dynamic> _notifications = [];
  List<double> _mq2History = [];
  List<int> _thresholdHistory = [];
  final Map<String, bool> _loading = {};
  
  SensorData get data => _data;
  List<dynamic> get notifications => _notifications;
  List<double> get mq2History => _mq2History;
  List<int> get thresholdHistory => _thresholdHistory;
  
  bool isLoading(String key) => _loading[key] ?? false;

  SensorProvider() {
    _init();
  }

  void _init() async {
    print('🚀 Initializing SensorProvider...');
    // Initial fetch
    try {
      print('📥 Fetching initial data...');
      final initialData = await _apiService.getData();
      print('📦 Initial data received: $initialData');
      if (initialData['success'] == true) {
        _updateData(initialData['data']);
        print('✅ Initial data updated');
      } else {
        print('⚠️ Initial data fetch unsuccessful: ${initialData['message']}');
      }
      
      print('📥 Fetching notifications...');
      _notifications = await _apiService.getNotifications();
      print('✅ Notifications fetched: ${_notifications.length} items');
      notifyListeners();
    } catch (e) {
      print('❌ Error fetching initial data: $e');
    }

    // Connect WebSocket
    print('🔌 Connecting to WebSocket...');
    _connectWebSocket();
  }

  void _connectWebSocket() {
    print('🔌 Setting up WebSocket listener...');
    _wsService.connect().listen(
      (message) {
        print('📨 WebSocket message received: $message');
        try {
          final decoded = json.decode(message);
          print('📦 Decoded message type: ${decoded['type']}');
          
          if (decoded['type'] == 'data') {
            print('🔄 Updating sensor data from WebSocket...');
            _updateData(decoded['data']);
          } else if (decoded['type'] == 'notification') {
            print('🔔 New notification received');
            _notifications.insert(0, decoded['data']);
            if (_notifications.length > 50) _notifications.removeLast();
            notifyListeners();
          } else if (decoded['type'] == 'notifications') {
            print('🔔 Notifications list received: ${decoded['data'].length} items');
            final List<dynamic> newNotifs = decoded['data'];
            _notifications = newNotifs;
            notifyListeners();
          }
        } catch (e) {
          print('❌ Error parsing WS message: $e');
        }
      },
      onError: (error) {
        print('❌ WebSocket error: $error');
        _data = _data.copyWith(connected: false);
        notifyListeners();
        // Reconnect logic
        print('⏳ Reconnecting WebSocket in 3 seconds...');
        Future.delayed(Duration(seconds: 3), _connectWebSocket);
      },
      onDone: () {
        print('🔌 WebSocket closed');
        _data = _data.copyWith(connected: false);
        notifyListeners();
        print('⏳ Reconnecting WebSocket in 3 seconds...');
        Future.delayed(Duration(seconds: 3), _connectWebSocket);
      },
    );
  }

  void _updateData(Map<String, dynamic> rawData) {
    print('🔄 Updating sensor data: $rawData');
    _data = SensorData.fromJson(rawData);
    _data = _data.copyWith(connected: true);
    print('✅ Data updated - Relay1: ${_data.relay1}, Relay2: ${_data.relay2}, Mode: ${_data.mode}');
    
    // Update history for chart
    _mq2History.add(_data.mq2.toDouble());
    _thresholdHistory.add(_data.threshold);
    
    // Keep last 180 points (30 mins)
    if (_mq2History.length > 180) {
      _mq2History.removeAt(0);
      _thresholdHistory.removeAt(0);
    }
    
    print('📊 History size: ${_mq2History.length} points (MQ2: ${_data.mq2})');
    
    notifyListeners();
    print('🔔 Listeners notified');
  }

  // Control methods
  Future<void> toggleRelay1() async {
    _loading['relay1'] = true;
    notifyListeners();
    try {
      final newState = !_data.relay1;
      await _apiService.controlRelay1(newState);
      // Update local state immediately for instant UI feedback
      _data = _data.copyWith(relay1: newState);
      print('✅ Relay1 updated locally to: $newState');
      notifyListeners();
    } catch (e) {
      print('❌ Error toggling relay1: $e');
    } finally {
      _loading['relay1'] = false;
      notifyListeners();
    }
  }

  Future<void> toggleRelay2() async {
    _loading['relay2'] = true;
    notifyListeners();
    try {
      final newState = !_data.relay2;
      await _apiService.controlRelay2(newState);
      // Update local state immediately for instant UI feedback
      _data = _data.copyWith(relay2: newState);
      print('✅ Relay2 updated locally to: $newState');
      notifyListeners();
    } catch (e) {
      print('❌ Error toggling relay2: $e');
    } finally {
      _loading['relay2'] = false;
      notifyListeners();
    }
  }

  Future<void> toggleWindow() async {
    _loading['window'] = true;
    notifyListeners();
    try {
      final newState = !_data.window;
      await _apiService.controlWindow(newState);
      // Update local state immediately for instant UI feedback
      _data = _data.copyWith(window: newState);
      print('✅ Window updated locally to: $newState');
      notifyListeners();
    } catch (e) {
      print('❌ Error toggling window: $e');
    } finally {
      _loading['window'] = false;
      notifyListeners();
    }
  }

  Future<void> toggleBuzzer() async {
    _loading['buzzer'] = true;
    notifyListeners();
    try {
      final newState = !_data.buzzer;
      await _apiService.controlBuzzer(newState);
      // Update local state immediately for instant UI feedback
      _data = _data.copyWith(buzzer: newState);
      print('✅ Buzzer updated locally to: $newState');
      notifyListeners();
    } catch (e) {
      print('❌ Error toggling buzzer: $e');
    } finally {
      _loading['buzzer'] = false;
      notifyListeners();
    }
  }

  Future<void> toggleMode() async {
    _loading['mode'] = true;
    notifyListeners();
    try {
      final newMode = _data.mode == 'AUTO' ? 'MANUAL' : 'AUTO';
      await _apiService.setMode(newMode);
      // Update local state immediately for instant UI feedback
      _data = _data.copyWith(mode: newMode);
      print('✅ Mode updated locally to: $newMode');
      notifyListeners();
    } catch (e) {
      print('❌ Error toggling mode: $e');
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
      // Update local state immediately for instant UI feedback
      _data = _data.copyWith(threshold: value);
      print('✅ Threshold updated locally to: $value');
      notifyListeners();
    } catch (e) {
      print('❌ Error setting threshold: $e');
    } finally {
      _loading['threshold'] = false;
      notifyListeners();
    }
  }

  // Helper method to refresh data from API
  Future<void> _refreshData() async {
    try {
      print('🔄 Refreshing data after control command...');
      final response = await _apiService.getData();
      if (response['success'] == true) {
        _updateData(response['data']);
        print('✅ Data refreshed successfully');
      }
    } catch (e) {
      print('❌ Error refreshing data: $e');
    }
  }
}
