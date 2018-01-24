package com.yrtech.excel;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;

import jxl.Workbook;
import jxl.write.Label;
import jxl.write.WritableSheet;
import jxl.write.WritableWorkbook;
import jxl.write.WriteException;
import jxl.write.biff.RowsExceededException;

/**
* This class echoes a string called from JavaScript.
*/
public class Excel extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("echo")) {
			try {
                WritableWorkbook workbook = Workbook.createWorkbook(new File("mnt/sdcard/com.yrtech.yfnd/test.xls"));
                WritableSheet sheet = workbook.createSheet("First Sheet", 0);
                Label label = new Label(0, 2, args.getString(0));
                sheet.addCell(label);
                Label number = new Label(3, 4, "3.1459");
                sheet.addCell(number);
                workbook.write();
                workbook.close();
			    callbackContext.success("com.yrtech.yfnd/test.xls");
				return ture;
            } catch (IOException e) {
			    callbackContext.error(e.getMessage());
                e.printStackTrace();
            } catch (RowsExceededException e) {
			    callbackContext.error(e.getMessage());
                e.printStackTrace();
            } catch (WriteException e) {
			    callbackContext.error(e.getMessage());
                e.printStackTrace();
            }
        }
        return false;
    }
}