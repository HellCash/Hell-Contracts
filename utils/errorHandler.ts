export class ErrorHandler {
  public static getMessage(err: any) {
      if(err?.data?.message != null) {
        return err?.data?.message.replace("VM Exception while processing transaction: revert ", "");
      }
      if (err?.error?.message) {
        return err?.error.message.replace("execution reverted: ", "");
      }
      if (err?.message) {
        return err.message;
      }
      return 'Unknown';
  }
}
