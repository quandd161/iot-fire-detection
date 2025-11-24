import 'package:web_socket_channel/web_socket_channel.dart';
import '../constants.dart';

class WebSocketService {
  WebSocketChannel? _channel;

  Stream<dynamic> connect() {
    try {
      _channel = WebSocketChannel.connect(Uri.parse(AppConstants.wsUrl));
      return _channel!.stream;
    } catch (e) {
      return Stream.error(e);
    }
  }

  void disconnect() {
    _channel?.sink.close();
  }
}
