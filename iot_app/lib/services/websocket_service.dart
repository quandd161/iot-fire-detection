import 'package:web_socket_channel/web_socket_channel.dart';
import '../constants.dart';

class WebSocketService {
  WebSocketChannel? _channel;

  Stream<dynamic> connect() {
    print(
      '🔌 WebSocketService: Attempting to connect to ${AppConstants.wsUrl}',
    );

    try {
      _channel = WebSocketChannel.connect(Uri.parse(AppConstants.wsUrl));
      print('✅ WebSocketService: Connection initiated');

      // Wrap stream with error handling
      return _channel!.stream.handleError((error) {
        print('❌ WebSocketService Stream Error: $error');
      });
    } catch (e) {
      print('❌ WebSocketService Connect Error: $e');
      print('🔧 Details: $e');
      return Stream.error(e);
    }
  }

  void disconnect() {
    print('🔌 WebSocketService: Disconnecting');
    _channel?.sink.close();
  }
}
